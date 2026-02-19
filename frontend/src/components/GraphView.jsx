import { useCallback, useRef, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

// Node radius: scales linearly from 4 (score=0) to 22 (score=100)
function nodeRadius(score) {
    return 4 + (score / 100) * 18
}

function getRiskColor(score) {
    if (score >= 70) return '#ef233c'
    if (score >= 30) return '#f59e0b'
    return '#3b82f6'
}

export default function GraphView({ data, loading }) {
    const containerRef = useRef(null)
    const [size, setSize] = useState({ width: 800, height: 600 })
    const [tick, setTick] = useState(0)

    // Pulse tick for high-risk nodes
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 400)
        return () => clearInterval(id)
    }, [])

    // Responsive sizing
    useEffect(() => {
        if (!containerRef.current) return
        const obs = new ResizeObserver(entries => {
            for (const entry of entries) {
                setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
            }
        })
        obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [])

    const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
        const score = node.suspicion_score ?? node.risk ?? 0
        const r = nodeRadius(score)
        const color = getRiskColor(score)
        const isHigh = score > 70

        if (isHigh) {
            // Pulsing red outer glow
            const pulse = 0.5 + 0.5 * Math.sin((tick * Math.PI) / 3)
            const glowR = r + 6 + pulse * 10

            // Outer pulse ring
            ctx.beginPath()
            ctx.arc(node.x, node.y, glowR, 0, 2 * Math.PI)
            ctx.fillStyle = `rgba(239,35,60,${(0.08 + pulse * 0.15).toFixed(2)})`
            ctx.fill()

            // Inner red halo
            ctx.beginPath()
            ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI)
            ctx.fillStyle = `rgba(239,35,60,0.35)`
            ctx.fill()

            // Pulsing red border
            ctx.beginPath()
            ctx.arc(node.x, node.y, r + 1.5, 0, 2 * Math.PI)
            ctx.strokeStyle = `rgba(239,35,60,${(0.6 + pulse * 0.4).toFixed(2)})`
            ctx.lineWidth = 2
            ctx.stroke()
        }

        // Core filled circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()

        // Static border for non-high-risk
        if (!isHigh) {
            ctx.beginPath()
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
            ctx.strokeStyle = `${color}70`
            ctx.lineWidth = 1
            ctx.stroke()
        }

        // Label when zoomed in
        if (globalScale > 0.75) {
            const label = node.id?.length > 8 ? node.id.slice(-6) : node.id
            ctx.font = `${Math.max(5, 9 / globalScale)}px JetBrains Mono, monospace`
            ctx.fillStyle = isHigh ? '#ffffff' : '#94a3b8'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, node.x, node.y + r + 7 / globalScale)
        }
    }, [tick])

    const linkColor = useCallback((link) => {
        const maxAmt = Math.max(...(data?.links || []).map(l => l.amount || 0), 1)
        const norm = (link.amount || 0) / maxAmt
        return `rgba(59,130,246,${(0.12 + norm * 0.5).toFixed(2)})`
    }, [data])

    const linkWidth = useCallback((link) => {
        const maxAmt = Math.max(...(data?.links || []).map(l => l.amount || 0), 1)
        return 0.5 + ((link.amount || 0) / maxAmt) * 3
    }, [data])

    return (
        <div ref={containerRef} className="w-full h-full relative graph-canvas">
            {loading && (
                <div className="absolute inset-0 bg-cyber-black/60 backdrop-blur-xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-3 glass-card rounded-lg px-6 py-3 border border-cyber-red/20">
                        <span className="w-2 h-2 bg-cyber-red rounded-full animate-ping" />
                        <span className="text-sm font-mono text-slate-300">Re-analysing…</span>
                    </div>
                </div>
            )}

            <ForceGraph2D
                graphData={data || { nodes: [], links: [] }}
                width={size.width}
                height={size.height}
                backgroundColor="#050508"
                nodeCanvasObject={nodeCanvasObject}
                nodeCanvasObjectMode={() => 'replace'}
                linkColor={linkColor}
                linkWidth={linkWidth}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkDirectionalArrowColor={linkColor}
                linkCurvature={0.08}
                cooldownTicks={120}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                nodeLabel={node => {
                    const score = node.suspicion_score ?? node.risk ?? 0
                    const color = getRiskColor(score)
                    return `<div style="background:#0a0a12;border:1px solid #1e2235;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:11px;color:#e2e8f0;line-height:1.6">
            <b style="color:${color}">${node.id}</b><br/>
            Score: <b style="color:${color}">${score.toFixed(1)}</b><br/>
            In: ${node.in_degree} · Out: ${node.out_degree}<br/>
            ${node.detected_patterns?.length ? 'Patterns: <b>' + node.detected_patterns.join(', ') + '</b>' : ''}
            ${node.ring_id ? '<br/>Ring: ' + node.ring_id : ''}
          </div>`
                }}
            />

            {/* Legend */}
            <div className="absolute bottom-4 right-4 glass-card rounded-xl p-4 border border-cyber-border text-xs font-mono space-y-2">
                <p className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[10px]">Suspicion Score</p>
                {[
                    { color: 'bg-cyber-red', label: '>70 — High Risk (pulsing)' },
                    { color: 'bg-cyber-amber', label: '30–70 — Medium Risk' },
                    { color: 'bg-cyber-blue', label: '<30 — Low / Normal' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${color} shrink-0`} />
                        <span className="text-slate-400 text-[10px]">{label}</span>
                    </div>
                ))}
                <p className="text-slate-600 text-[10px] pt-1 border-t border-cyber-border">
                    Node size ∝ suspicion score
                </p>
            </div>
        </div>
    )
}
