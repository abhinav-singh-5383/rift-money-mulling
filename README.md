# 🔴 RIFT 2026 — Financial Forensic Engine

> Real-time money mule network detection using graph analysis and weighted heuristic scoring.

**Live Demo:** [rift26.netlify.app](https://rift26.netlify.app) | **Backend API:** [rift-money-mulling.onrender.com](https://rift-money-mulling.onrender.com)

---

## What It Does

RIFT ingests financial transaction CSVs and automatically detects:

| Pattern | Detection Method | Score |
|---------|-----------------|-------|
| **Circular Wash** | Strongly Connected Components (SCC) | +50 pts |
| **Smurfing** | Fan-in > 5 unique senders | +5 pts/sender, cap 30 |
| **High Velocity** | Money exits within 15 min of arrival | +20 pts |

Results are visualised as an interactive force graph — node size and colour map directly to suspicion score, and accounts scoring >70 pulse with a red glow.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS |
| Graph viz | `react-force-graph-2d` |
| Backend | FastAPI + NetworkX + pandas |
| Hosting | Netlify (frontend) + Render (backend) |

---

## Project Structure

```
rift-2026/
├── backend/
│   ├── main.py            # FastAPI app — scoring engine, API routes
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   └── LabPage.jsx        # Main dashboard + upload + polling
│   │   └── components/
│   │       ├── GraphView.jsx      # Force graph with score-based styling
│   │       ├── EvidenceLocker.jsx # Top 10 suspects sidebar
│   │       ├── FraudRingTable.jsx # Fraud Ring Intelligence table
│   │       └── DropZone.jsx       # CSV upload
│   └── index.html
├── netlify.toml           # Build config + /api/* proxy to Render
├── render.yaml            # Render service config
└── LOGIC_EXPLAINER.md     # Plain-English writeup for judges
```

---

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npx vite --port 5173
```

Open [http://localhost:5173](http://localhost:5173) — demo data loads automatically.

---

## CSV Format

Upload any CSV with these columns:

```
transaction_id, sender_id, receiver_id, amount, timestamp
```

`timestamp` can be any parseable datetime format (ISO 8601, etc.).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/demo` | Run analysis on built-in fraud dataset |
| `POST` | `/upload` | Upload CSV → returns `job_id` immediately |
| `GET` | `/result/{job_id}` | Poll for async analysis result |
| `GET` | `/report` | Download full `rift_forensic_report.json` |

### Report JSON Schema
```json
{
  "suspicious_accounts": [
    { "account_id": "string", "suspicion_score": 0.0, "detected_patterns": ["cycle"], "ring_id": "string" }
  ],
  "fraud_rings": [
    { "ring_id": "string", "member_accounts": ["string"], "pattern_type": "string", "risk_score": 0.0 }
  ],
  "summary": {
    "total_accounts_analyzed": 0, "suspicious_accounts_flagged": 0,
    "fraud_rings_detected": 0, "processing_time_seconds": 0.0
  }
}
```

---

## Deploying

### Render (Backend)
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Netlify (Frontend)
- `netlify.toml` auto-configures everything
- The `/api/*` proxy routes frontend requests to Render server-side (no CORS issues)
- No environment variables needed

---

## Demo Results (built-in dataset)

- **49 accounts** · **56 transactions** · **~15ms** processing
- **3 fraud rings** detected: 2 circular wash, 1 smurfing hub
- **12 accounts flagged** — top scoring: ACC002, ACC011, ACC003 at 70.0

---

*Built for RIFT 2026 Hackathon.*
