# 🔍 RIFT 2026 — Logic Explainer
### How Graph-Based Financial Forensics Works (For Judges & Non-Technical Stakeholders)

---

## The Big Picture: Thinking in Networks, Not Spreadsheets

Traditional fraud detection looks at one transaction at a time: *"Is this amount suspicious?"*

Our engine thinks differently. We ask: **"How does money flow *across* a network of people?"**

Instead of a spreadsheet, we build a **map** — a directed graph — where:
- Every **account** is a dot (node)
- Every **transaction** is an arrow (edge) pointing from sender to receiver, labelled with the amount

Once that map exists, three forensic algorithms hunt for criminal patterns that are invisible in raw CSV data.

---

## Algorithm 1: Cycle Detection — "The Money Circle" 🔴

### What it detects
Money laundering relies on **obscuring the origin of funds**. A classic technique is to move money in a circle so the trail leads nowhere:

```
Account A  →  Account B  →  Account C  →  back to Account A
```

This is called a **money laundering cycle**, and it's the forensic equivalent of a fingerprint.

### The algorithm: Strongly Connected Components (SCC)
We use an algorithm called **Kosaraju's SCC** (built into NetworkX). It answers one question:

> *"Can I start at node A, follow the arrows, and eventually return to node A?"*

If yes — that group of accounts forms a **Strongly Connected Component** and is flagged as a potential laundering ring.

### In plain terms
Imagine tracing a path on a map. A cycle means you keep following roads and you end up back where you started — with slightly different amounts each time (to make it look like separate transactions).

**Risk contribution: +40 points**

---

## Algorithm 2: Hub Detection — "The Smurf" 🔵

### What it detects
**Smurfing** is when a criminal network uses **many small accounts** to funnel money into one central account, then distribute it to several destination accounts. The central account is called a **money mule aggregator** or **hub**.

```
Smurf 1 ──┐
Smurf 2 ──┤
Smurf 3 ──┼──▶  HUB (ACC020)  ──┬──▶ Layer Account 1
Smurf 4 ──┤                     ├──▶ Layer Account 2
Smurf 5 ──┘                     └──▶ Layer Account 3
```

### The algorithm: Degree Centrality
Every node in the graph has two scores:

| Term | Plain English | Meaning |
|------|--------------|---------|
| **In-degree** | How many arrows *point at* this account | Money arrives from many places |
| **Out-degree** | How many arrows *leave* this account | Money is sent to many places |

**Degree Centrality** normalises these counts (0 to 1) so we can compare accounts of any network size.

A node in the **top 15% of both** in-degree AND out-degree centrality is flagged as a Hub — it's both a collection point and a distribution point, which is the structural hallmark of a money mule.

**Risk contribution: +30 points (Hub) / +15 points (High-Flow)**

---

## Algorithm 3: Temporal Analysis — "The Hot Potato" 🟡

### What it detects
A money mule minimises their exposure by holding funds for the shortest possible time. They receive money and **immediately forward most of it** — hoping rapid movement hides the trail.

### The algorithm: 10-Minute Pass-Through Check
For every account, we ask:

> *"Within 10 minutes of receiving money, did this account forward more than 90% of what it received?"*

If yes, the account is behaving like a **relay node** — not like a normal person's bank account.

### In plain terms
A normal person receives a salary and spends it over days or weeks. A money mule receives $18,000 and sends $17,500 within 5 minutes. That 97% pass-through rate in a 10-minute window is statistically anomalous — and that's exactly what we catch.

**Risk contribution: +30 points**

---

## Risk Score Formula

Each account receives a **composite risk score from 0 to 100**:

```
Risk = (Cycle Membership × 40)
     + (Hub Centrality Score × 30)
     + (Temporal Pass-Through × 30)

→ Normalised to 0–100
```

| Score | Meaning | Colour |
|-------|---------|--------|
| 70–100 | **High Risk** — Likely money mule | 🔴 Red (pulsing) |
| 40–69  | **Medium Risk** — Suspicious pattern | 🟡 Amber |
| 0–39   | **Low Risk** — Normal behaviour | 🔵 Blue |

---

## Why Graph Theory? Why Not Just Rules?

| Traditional Rule-Based | Our Graph Engine |
|------------------------|-----------------|
| "Flag transactions > $10,000" | Catch $9,900 smurfed across 10 accounts |
| Can't see network patterns | Detects cycles of any length |
| Misses coordinated behaviour | Identifies hub-and-spoke structures |
| No temporal context | Flags rapid-fire pass-throughs |

Criminals **adapt to rules**. They cannot easily adapt to graph structure — because the structure is an emergent property of how they must move money.

---

## Summary for Judges

> We transform raw transaction data into a directed graph, then run three algorithms:
> 1. **SCC** to find money laundering loops
> 2. **Degree Centrality** to find smurfing aggregators
> 3. **Temporal window analysis** to find rapid pass-through mules
>
> Each algorithm contributes to a 0–100 risk score, visualised as a real-time interactive graph where red pulsing nodes are your prime suspects.

---

*Built for RIFT 2026 · Cybersecurity Track · Follow the Flow*
