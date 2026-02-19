import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Upload, RefreshCw, AlertTriangle, CheckCircle, Activity, Shield, Download, Clock } from 'lucide-react'
import GraphView from '../components/GraphView'
import EvidenceLocker from '../components/EvidenceLocker'
import DropZone from '../components/DropZone'
import FraudRingTable from '../components/FraudRingTable'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function LabPage({ onBack }) {
    const [graphData, setGraphData] = useState(null)
    const [top10, setTop10] = useState([])
    const [fraudRings, setFraudRings] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fileName, setFileName] = useState(null)
    const [isDemo, setIsDemo] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const processResult = useCallback((data) => {
        setGraphData({ nodes: data.nodes, links: data.edges })
        setTop10(data.top10 || [])
        setFraudRings(data.fraud_rings || [])
        setSummary(data.summary || null)
        setError(null)
    }, [])

    // Auto-load demo on mount
    useEffect(() => {
        const fetchDemo = async () => {
            setLoading(true)
            setIsDemo(true)
            try {
                const res = await fetch(`${API}/demo`)
                if (!res.ok) throw new Error(`Backend responded ${res.status}`)
                const data = await res.json()
                processResult(data)
                setFileName('demo_fraud.csv')
            } catch (e) {
                setError(`Cannot reach backend: ${e.message}.\n\nStart it with:\n  cd backend\n  python3 -m uvicorn main:app --reload`)
            } finally {
                setLoading(false)
            }
        }
        fetchDemo()
    }, [processResult])

    const handleFileUpload = useCallback(async (file) => {
        if (!file) return
        setLoading(true)
        setIsDemo(false)
        setFileName(file.name)
        try {
            const form = new FormData()
            form.append('file', file)
            const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || `HTTP ${res.status}`)
            }
            const data = await res.json()
            processResult(data)
        } catch (e) {
            setError(`Upload failed: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }, [processResult])

    const reloadDemo = useCallback(async () => {
        setLoading(true)
        setIsDemo(true)
        setFileName('demo_fraud.csv')
        try {
            const res = await fetch(`${API}/demo`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            processResult(data)
        } catch (e) {
            setError(`Demo reload failed: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }, [processResult])

    const downloadReport = useCallback(async () => {
        setDownloading(true)
        try {
            const res = await fetch(`${API}/report`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'rift_forensic_report.json'
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (e) {
            alert(`Download failed: ${e.message}`)
        } finally {
            setDownloading(false)
        }
    }, [])

    const highRiskCount = (graphData?.nodes || []).filter(n => (n.suspicion_score ?? n.risk ?? 0) >= 70).length

    return (
        <div className="min-h-screen bg-cyber-black grid-bg flex flex-col">
            <div className="scan-line" />

            {/* ── Nav ── */}
            <nav className="flex items-center justify-between px-6 py-4 border-b border-cyber-border/60 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button
                        id="back-btn"
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-mono group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </button>
                    <div className="w-px h-5 bg-cyber-border" />
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyber-red" />
                        <span className="font-mono text-sm font-bold text-white tracking-wider">
                            THE <span className="text-cyber-red">LAB</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isDemo && (
                        <span className="font-mono text-xs px-2 py-1 rounded border border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber">
                            DEMO MODE
                        </span>
                    )}
                    {summary && (
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                            <Clock className="w-3 h-3" />
                            {summary.processing_time_seconds}s
                        </div>
                    )}
                    {graphData && (
                        <button
                            id="download-report-btn"
                            onClick={downloadReport}
                            disabled={downloading}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-red/10 border border-cyber-red/40 text-cyber-red hover:bg-cyber-red/20 text-xs font-mono font-semibold transition-all disabled:opacity-40"
                        >
                            <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
                            {downloading ? 'Exporting…' : 'Export JSON'}
                        </button>
                    )}
                    <button
                        id="reload-demo-btn"
                        onClick={reloadDemo}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyber-border text-slate-400 hover:text-white hover:border-cyber-red/50 text-xs font-mono transition-all disabled:opacity-40"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Reload Demo
                    </button>
                </div>
            </nav>

            {/* ── Stats bar ── */}
            {graphData && (
                <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-b border-cyber-border/40 bg-cyber-slate/40 z-10 shrink-0">
                    <Stat label="Accounts" value={summary?.total_accounts_analyzed ?? graphData.nodes.length} color="text-cyber-blue-light" />
                    <Stat label="Transactions" value={graphData.links.length} color="text-slate-300" />
                    <Stat label="Flagged" value={summary?.suspicious_accounts_flagged ?? '—'} color="text-cyber-amber" />
                    <Stat label="Fraud Rings" value={summary?.fraud_rings_detected ?? fraudRings.length} color="text-cyber-red" />
                    {highRiskCount > 0 && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            <AlertTriangle className="w-3.5 h-3.5 text-cyber-red animate-pulse" />
                            <span className="text-cyber-red font-mono text-xs font-semibold">
                                {highRiskCount} critical suspect{highRiskCount !== 1 ? 's' : ''} (score &gt;70)
                            </span>
                        </div>
                    )}
                    {highRiskCount === 0 && graphData && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            <CheckCircle className="w-3.5 h-3.5 text-cyber-green" />
                            <span className="text-cyber-green font-mono text-xs">No critical accounts</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Main Content ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left sidebar */}
                <aside className="w-80 xl:w-96 flex flex-col border-r border-cyber-border/60 shrink-0 overflow-y-auto">
                    <div className="p-4 border-b border-cyber-border/40">
                        <DropZone onFile={handleFileUpload} loading={loading} fileName={fileName} />
                    </div>
                    <div className="flex-1 p-4">
                        <EvidenceLocker data={top10} loading={loading} />
                    </div>
                </aside>

                {/* Right panel */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Graph */}
                    <div className="flex-1 relative overflow-hidden min-h-0">
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
                                <div className="glass-card rounded-xl p-8 max-w-lg w-full border border-cyber-red/30 text-center">
                                    <AlertTriangle className="w-10 h-10 text-cyber-red mx-auto mb-4" />
                                    <p className="text-white font-semibold mb-3">Connection Error</p>
                                    <pre className="text-slate-400 text-xs font-mono text-left whitespace-pre-wrap bg-cyber-gray rounded-lg p-3">{error}</pre>
                                </div>
                            </div>
                        )}
                        {loading && !graphData && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="text-center">
                                    <Activity className="w-10 h-10 text-cyber-red mx-auto mb-4 animate-pulse" />
                                    <p className="text-slate-400 font-mono text-sm">Analysing transaction graph…</p>
                                </div>
                            </div>
                        )}
                        {graphData && <GraphView data={graphData} loading={loading} />}
                        {!graphData && !loading && !error && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-slate-600 font-mono text-sm">Drop a CSV to begin analysis</p>
                            </div>
                        )}
                    </div>

                    {/* Fraud Ring Intelligence table — below graph */}
                    {(graphData || loading) && (
                        <div className="shrink-0 border-t border-cyber-border/60 bg-cyber-slate/20 p-6 max-h-80 overflow-y-auto">
                            <FraudRingTable rings={fraudRings} loading={loading} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

function Stat({ label, value, color }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">{label}</span>
            <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
        </div>
    )
}
