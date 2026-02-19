import io
import csv
import time
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

import pandas as pd
import networkx as nx
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="RIFT 2026 – Financial Forensic Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Sample Fraud Data Generator
# ---------------------------------------------------------------------------

def generate_sample_fraud_csv(path: str = "sample_fraud.csv") -> str:
    random.seed(42)
    base_time = datetime(2025, 1, 10, 8, 0, 0)
    rows = []
    tid = 1

    def ts(offset_minutes: float) -> str:
        return (base_time + timedelta(minutes=offset_minutes)).strftime("%Y-%m-%dT%H:%M:%S")

    def row(sender, receiver, amount, offset):
        nonlocal tid
        rows.append({
            "transaction_id": f"TXN{tid:04d}",
            "sender_id": sender,
            "receiver_id": receiver,
            "amount": round(amount, 2),
            "timestamp": ts(offset),
        })
        tid += 1

    # Cycle 1: ACC001 → ACC002 → ACC003 → ACC001
    row("ACC001", "ACC002", 9500, 0)
    row("ACC002", "ACC003", 9300, 5)
    row("ACC003", "ACC001", 9100, 10)

    # Cycle 2: ACC010 → ACC011 → ACC012 → ACC013 → ACC010
    row("ACC010", "ACC011", 45000, 2)
    row("ACC011", "ACC012", 44200, 7)
    row("ACC012", "ACC013", 43500, 12)
    row("ACC013", "ACC010", 42800, 18)

    # Smurfing Hub: 12 smurfs → ACC020 → multiple layers
    smurfs = [f"SRF{i:03d}" for i in range(1, 13)]
    layers = [f"LYR{i:03d}" for i in range(1, 6)]
    for i, s in enumerate(smurfs):
        row(s, "ACC020", random.uniform(4000, 9000), i * 2)
    for i, l in enumerate(layers):
        row("ACC020", l, random.uniform(5000, 12000), 25 + i * 4)

    # High-velocity pass-through: ACC030 (arrives and leaves < 15 min)
    row("EXT001", "ACC030", 18000, 1)
    row("ACC030", "EXT002", 17500, 6)

    row("EXT003", "ACC031", 22000, 30)
    row("ACC031", "EXT004", 21500, 33)

    # Normal background transactions
    normal_accounts = [f"NRM{i:03d}" for i in range(1, 20)]
    for _ in range(28):
        a, b = random.sample(normal_accounts, 2)
        row(a, b, random.uniform(100, 5000), random.uniform(0, 480))

    rows.sort(key=lambda x: x["timestamp"])

    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(
            f, fieldnames=["transaction_id", "sender_id", "receiver_id", "amount", "timestamp"]
        )
        writer.writeheader()
        writer.writerows(rows)

    return path


# ---------------------------------------------------------------------------
# Core Analysis Engine
# ---------------------------------------------------------------------------

def analyze_transactions(df: pd.DataFrame) -> Dict[str, Any]:
    t_start = time.perf_counter()

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)

    G = nx.DiGraph()
    for _, r in df.iterrows():
        G.add_edge(
            r["sender_id"], r["receiver_id"],
            weight=float(r["amount"]),
            transaction_id=r["transaction_id"],
            timestamp=str(r["timestamp"]),
        )

    all_nodes = list(G.nodes())
    suspicion: Dict[str, float] = {n: 0.0 for n in all_nodes}
    patterns: Dict[str, List[str]] = {n: [] for n in all_nodes}
    ring_membership: Dict[str, str] = {}

    # -------------------------------------------------------------------------
    # 1. CYCLE DETECTION — SCCs ≥ 2 nodes → +50 pts
    # -------------------------------------------------------------------------
    fraud_rings_raw = []
    for component in nx.strongly_connected_components(G):
        if len(component) >= 2:
            ring_id = f"RING-{uuid.uuid4().hex[:6].upper()}"
            members = sorted(component)
            # Determine dominant pattern within the ring
            member_in_degrees = [G.in_degree(n) for n in members]
            avg_in = sum(member_in_degrees) / len(member_in_degrees)
            pattern_type = "smurfing" if avg_in > 2 else "circular_wash"

            # Risk score for the ring = avg suspicion after full analysis (placeholder, recalculated below)
            fraud_rings_raw.append({
                "ring_id": ring_id,
                "member_accounts": members,
                "pattern_type": pattern_type,
            })
            for node in component:
                ring_membership[node] = ring_id
                patterns[node].append("cycle")
                suspicion[node] += 50.0

    # -------------------------------------------------------------------------
    # 2. SMURFING (FAN-IN) — +5 per unique sender beyond 5, capped at 30 pts
    # -------------------------------------------------------------------------
    for node in all_nodes:
        unique_senders = set(df[df["receiver_id"] == node]["sender_id"].tolist())
        n_senders = len(unique_senders)
        if n_senders > 5:
            pts = min(30.0, (n_senders - 5) * 5.0)
            suspicion[node] += pts
            if "smurfing" not in patterns[node]:
                patterns[node].append("smurfing")

    # -------------------------------------------------------------------------
    # 3. HIGH VELOCITY — enters and leaves within 15 min → +20 pts
    # -------------------------------------------------------------------------
    VELOCITY_WINDOW = 15 * 60  # 15 minutes in seconds

    for node in all_nodes:
        received = df[df["receiver_id"] == node][["timestamp", "amount"]].copy()
        sent     = df[df["sender_id"]   == node][["timestamp", "amount"]].copy()
        if received.empty or sent.empty:
            continue
        flagged = False
        for _, rx_row in received.iterrows():
            if flagged:
                break
            rx_time   = rx_row["timestamp"]
            window_end = rx_time + pd.Timedelta(seconds=VELOCITY_WINDOW)
            sent_in_window = sent[
                (sent["timestamp"] >= rx_time) & (sent["timestamp"] <= window_end)
            ]["amount"].sum()
            if sent_in_window > 0:
                flagged = True
                suspicion[node] += 20.0
                if "layering" not in patterns[node]:
                    patterns[node].append("layering")

    # -------------------------------------------------------------------------
    # Cap at 100
    # -------------------------------------------------------------------------
    suspicion = {n: min(100.0, round(v, 1)) for n, v in suspicion.items()}

    # -------------------------------------------------------------------------
    # Build fraud ring risk scores (avg member suspicion)
    # -------------------------------------------------------------------------
    fraud_rings = []
    for ring in fraud_rings_raw:
        members = ring["member_accounts"]
        ring_risk = round(sum(suspicion[m] for m in members) / len(members), 1)
        fraud_rings.append({
            "ring_id": ring["ring_id"],
            "member_accounts": members,
            "pattern_type": ring["pattern_type"],
            "risk_score": ring_risk,
        })

    # -------------------------------------------------------------------------
    # Build nodes / edges payload
    # -------------------------------------------------------------------------
    nodes_out = []
    for n in all_nodes:
        nodes_out.append({
            "id": n,
            "suspicion_score": suspicion.get(n, 0.0),
            # keep legacy "risk" alias for front-end compatibility
            "risk": suspicion.get(n, 0.0),
            "detected_patterns": patterns.get(n, []),
            "flags": patterns.get(n, []),
            "ring_id": ring_membership.get(n),
            "in_degree": G.in_degree(n),
            "out_degree": G.out_degree(n),
        })

    edges_out = []
    for u, v, data in G.edges(data=True):
        edges_out.append({
            "source": u,
            "target": v,
            "amount": data.get("weight", 0),
            "transaction_id": data.get("transaction_id", ""),
        })

    suspicious_accounts = sorted(
        [n for n in nodes_out if n["suspicion_score"] > 0],
        key=lambda x: x["suspicion_score"],
        reverse=True,
    )

    top10 = suspicious_accounts[:10]

    processing_time = round(time.perf_counter() - t_start, 4)

    return {
        "nodes": nodes_out,
        "edges": edges_out,
        "top10": top10,
        "fraud_rings": fraud_rings,
        "summary": {
            "total_accounts_analyzed": len(all_nodes),
            "suspicious_accounts_flagged": len([n for n in nodes_out if n["suspicion_score"] >= 30]),
            "fraud_rings_detected": len(fraud_rings),
            "processing_time_seconds": processing_time,
        },
    }


# Store last analysis for the /report endpoint
_last_analysis: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "RIFT 2026 Financial Forensic Engine"}


@app.get("/demo")
def demo():
    csv_path = generate_sample_fraud_csv("sample_fraud.csv")
    df = pd.read_csv(csv_path)
    result = analyze_transactions(df)
    _last_analysis.update(result)
    return result


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
        required = {"transaction_id", "sender_id", "receiver_id", "amount", "timestamp"}
        missing = required - set(df.columns)
        if missing:
            raise HTTPException(status_code=422, detail=f"CSV missing columns: {missing}")
        result = analyze_transactions(df)
        _last_analysis.update(result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/report")
def report():
    """
    Download the forensic report as exact JSON schema required by RIFT 2026.
    Call /demo or /upload first to populate the analysis.
    """
    if not _last_analysis:
        raise HTTPException(status_code=404, detail="No analysis yet. Call /demo or /upload first.")

    nodes     = _last_analysis.get("nodes", [])
    rings     = _last_analysis.get("fraud_rings", [])
    summary   = _last_analysis.get("summary", {})

    suspicious_accounts = sorted(
        [
            {
                "account_id": n["id"],
                "suspicion_score": n["suspicion_score"],
                "detected_patterns": n["detected_patterns"],
                "ring_id": n.get("ring_id") or "",
            }
            for n in nodes if n["suspicion_score"] > 0
        ],
        key=lambda x: x["suspicion_score"],
        reverse=True,
    )

    fraud_rings_export = [
        {
            "ring_id": r["ring_id"],
            "member_accounts": r["member_accounts"],
            "pattern_type": r["pattern_type"],
            "risk_score": r["risk_score"],
        }
        for r in rings
    ]

    payload = {
        "suspicious_accounts": suspicious_accounts,
        "fraud_rings": fraud_rings_export,
        "summary": summary,
    }

    return JSONResponse(
        content=payload,
        headers={"Content-Disposition": 'attachment; filename="rift_forensic_report.json"'},
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
