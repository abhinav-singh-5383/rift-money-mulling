import io
import csv
import time
import random
import uuid
import threading
from datetime import datetime, timedelta
from typing import Dict, Any

import pandas as pd
import networkx as nx
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="RIFT 2026 – Financial Forensic Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store — resets on service restart (fine for demo)
_jobs: Dict[str, Dict] = {}
_last_analysis: Dict[str, Any] = {}

VIZ_NODE_LIMIT  = 300
VIZ_EDGE_LIMIT  = 600
VELOCITY_WINDOW = 15 * 60   # seconds


# ---------------------------------------------------------------------------
# Sample Data Generator
# ---------------------------------------------------------------------------

def generate_sample_fraud_csv(path: str = "sample_fraud.csv") -> str:
    random.seed(42)
    base_time = datetime(2025, 1, 10, 8, 0, 0)
    rows, tid = [], 1

    def ts(offset_minutes: float) -> str:
        return (base_time + timedelta(minutes=offset_minutes)).strftime("%Y-%m-%dT%H:%M:%S")

    def row(sender, receiver, amount, offset):
        nonlocal tid
        rows.append({"transaction_id": f"TXN{tid:04d}", "sender_id": sender,
                     "receiver_id": receiver, "amount": round(amount, 2), "timestamp": ts(offset)})
        tid += 1

    row("ACC001", "ACC002", 9500, 0);  row("ACC002", "ACC003", 9300, 5);  row("ACC003", "ACC001", 9100, 10)
    row("ACC010", "ACC011", 45000, 2); row("ACC011", "ACC012", 44200, 7)
    row("ACC012", "ACC013", 43500, 12); row("ACC013", "ACC010", 42800, 18)

    smurfs = [f"SRF{i:03d}" for i in range(1, 13)]
    for i, s in enumerate(smurfs):
        row(s, "ACC020", random.uniform(4000, 9000), i * 2)
    for i in range(5):
        row("ACC020", f"LYR{i+1:03d}", random.uniform(5000, 12000), 25 + i * 4)

    row("EXT001", "ACC030", 18000, 1);  row("ACC030", "EXT002", 17500, 6)
    row("EXT003", "ACC031", 22000, 30); row("ACC031", "EXT004", 21500, 33)

    normal = [f"NRM{i:03d}" for i in range(1, 20)]
    for _ in range(28):
        a, b = random.sample(normal, 2)
        row(a, b, random.uniform(100, 5000), random.uniform(0, 480))

    rows.sort(key=lambda x: x["timestamp"])
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["transaction_id","sender_id","receiver_id","amount","timestamp"])
        writer.writeheader(); writer.writerows(rows)
    return path


# ---------------------------------------------------------------------------
# Core Analysis (vectorised — handles 100k+ rows)
# ---------------------------------------------------------------------------

def analyze_transactions(df: pd.DataFrame) -> Dict[str, Any]:
    t0 = time.perf_counter()
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], infer_datetime_format=True)
    df["amount"]    = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
    df.sort_values("timestamp", inplace=True, ignore_index=True)

    # Build directed graph
    G = nx.DiGraph()
    for _, r in df.iterrows():
        G.add_edge(r["sender_id"], r["receiver_id"],
                   weight=float(r["amount"]),
                   transaction_id=str(r.get("transaction_id", "")),
                   timestamp=str(r["timestamp"]))

    all_nodes = list(G.nodes())
    suspicion: Dict[str, float] = {n: 0.0 for n in all_nodes}
    patterns:  Dict[str, list]  = {n: []   for n in all_nodes}
    ring_membership: Dict[str, str] = {}

    # 1. Cycle Detection — SCC ≥ 2 → +50 pts
    fraud_rings_raw = []
    for comp in nx.strongly_connected_components(G):
        if len(comp) >= 2:
            ring_id = f"RING-{uuid.uuid4().hex[:6].upper()}"
            members = sorted(comp)
            avg_in  = sum(G.in_degree(n) for n in members) / len(members)
            pattern_type = "smurfing" if avg_in > 2 else "circular_wash"
            fraud_rings_raw.append({"ring_id": ring_id, "member_accounts": members, "pattern_type": pattern_type})
            for node in comp:
                ring_membership[node] = ring_id
                patterns[node].append("cycle")
                suspicion[node] += 50.0

    # 2. Smurfing (Fan-In) — +5 per unique sender beyond 5, cap 30 pts
    fan_in = df.groupby("receiver_id")["sender_id"].nunique()
    for node, n_senders in fan_in.items():
        if n_senders > 5:
            suspicion[node] = suspicion.get(node, 0.0) + min(30.0, (n_senders - 5) * 5.0)
            if "smurfing" not in patterns.get(node, []):
                patterns.setdefault(node, []).append("smurfing")

    # 3. High Velocity — vectorised merge, +20 pts
    recv = df[["receiver_id","timestamp"]].rename(columns={"receiver_id":"account","timestamp":"recv_ts"})
    sent = df[["sender_id","timestamp"]].rename(columns={"sender_id":"account","timestamp":"send_ts"})
    merged = recv.merge(sent, on="account")
    delta  = (merged["send_ts"] - merged["recv_ts"]).dt.total_seconds()
    hits   = merged[(delta >= 0) & (delta <= VELOCITY_WINDOW)]
    for node in hits["account"].unique():
        suspicion[node] = suspicion.get(node, 0.0) + 20.0
        if "layering" not in patterns.get(node, []):
            patterns.setdefault(node, []).append("layering")

    # Cap at 100
    suspicion = {n: min(100.0, round(v, 1)) for n, v in suspicion.items()}

    # Fraud rings with avg risk score
    fraud_rings = []
    for ring in fraud_rings_raw:
        members   = ring["member_accounts"]
        ring_risk = round(sum(suspicion[m] for m in members) / len(members), 1)
        fraud_rings.append({**ring, "risk_score": ring_risk})

    # Build full node list
    nodes_full = sorted([
        {"id": n, "suspicion_score": suspicion.get(n,0.0), "risk": suspicion.get(n,0.0),
         "detected_patterns": patterns.get(n,[]), "flags": patterns.get(n,[]),
         "ring_id": ring_membership.get(n), "in_degree": G.in_degree(n), "out_degree": G.out_degree(n)}
        for n in all_nodes
    ], key=lambda x: x["suspicion_score"], reverse=True)

    top10 = nodes_full[:10]

    # Trim for visualisation
    viz_ids  = {n["id"] for n in nodes_full[:VIZ_NODE_LIMIT]}
    nodes_viz = [n for n in nodes_full if n["id"] in viz_ids]
    edges_all = [{"source": u, "target": v, "amount": d.get("weight",0),
                  "transaction_id": d.get("transaction_id","")}
                 for u, v, d in G.edges(data=True)]
    edges_viz = [e for e in edges_all
                 if e["source"] in viz_ids and e["target"] in viz_ids][:VIZ_EDGE_LIMIT]

    processing_time = round(time.perf_counter() - t0, 4)
    summary = {
        "total_accounts_analyzed":  len(all_nodes),
        "total_transactions":       len(df),
        "suspicious_accounts_flagged": len([n for n in nodes_full if n["suspicion_score"] >= 30]),
        "fraud_rings_detected":     len(fraud_rings),
        "processing_time_seconds":  processing_time,
        "viz_nodes_shown":          len(nodes_viz),
    }

    return {
        "nodes": nodes_viz, "edges": edges_viz,
        "top10": top10, "fraud_rings": fraud_rings, "summary": summary,
        "_nodes_full": nodes_full, "_edges_full": edges_all,
    }


# ---------------------------------------------------------------------------
# Background worker
# ---------------------------------------------------------------------------

def _run_job(job_id: str, raw: bytes) -> None:
    try:
        df = pd.read_csv(io.BytesIO(raw))
        required = {"transaction_id", "sender_id", "receiver_id", "amount", "timestamp"}
        missing  = required - set(df.columns)
        if missing:
            _jobs[job_id] = {"status": "error", "detail": f"Missing columns: {missing}"}
            return
        result = analyze_transactions(df)
        _last_analysis.update(result)
        _jobs[job_id] = {"status": "done", "result": {k: v for k, v in result.items() if not k.startswith("_")}}
    except Exception as e:
        _jobs[job_id] = {"status": "error", "detail": str(e)}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "RIFT 2026 Financial Forensic Engine"}


@app.get("/demo")
def demo():
    csv_path = generate_sample_fraud_csv("sample_fraud.csv")
    result   = analyze_transactions(pd.read_csv(csv_path))
    _last_analysis.update(result)
    return {k: v for k, v in result.items() if not k.startswith("_")}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    """Accepts any size CSV. Returns a job_id immediately; poll /result/{job_id}."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    raw     = await file.read()
    job_id  = uuid.uuid4().hex[:8].upper()
    _jobs[job_id] = {"status": "processing"}
    t = threading.Thread(target=_run_job, args=(job_id, raw), daemon=True)
    t.start()
    return {"job_id": job_id, "status": "processing"}


@app.get("/result/{job_id}")
def result(job_id: str):
    """Poll this endpoint after /upload until status == 'done'."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


@app.get("/report")
def report():
    if not _last_analysis:
        raise HTTPException(status_code=404, detail="No analysis yet.")
    nodes_full = _last_analysis.get("_nodes_full", _last_analysis.get("nodes", []))
    rings      = _last_analysis.get("fraud_rings", [])
    summary    = _last_analysis.get("summary", {})
    payload = {
        "suspicious_accounts": sorted(
            [{"account_id": n["id"], "suspicion_score": n["suspicion_score"],
              "detected_patterns": n["detected_patterns"], "ring_id": n.get("ring_id") or ""}
             for n in nodes_full if n["suspicion_score"] > 0],
            key=lambda x: x["suspicion_score"], reverse=True),
        "fraud_rings": [{"ring_id": r["ring_id"], "member_accounts": r["member_accounts"],
                         "pattern_type": r["pattern_type"], "risk_score": r["risk_score"]}
                        for r in rings],
        "summary": summary,
    }
    return JSONResponse(content=payload,
                        headers={"Content-Disposition": 'attachment; filename="rift_forensic_report.json"'})


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
