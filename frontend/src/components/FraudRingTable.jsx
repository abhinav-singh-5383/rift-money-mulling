import { ShieldAlert, Users, TrendingUp } from 'lucide-react'

const PATTERN_COLOR = {
    circular_wash: { bg: 'bg-cyber-red/10', text: 'text-cyber-red', border: 'border-cyber-red/30' },
    smurfing: { bg: 'bg-cyber-blue/10', text: 'text-cyber-blue-light', border: 'border-cyber-blue/30' },
    layering: { bg: 'bg-cyber-amber/10', text: 'text-cyber-amber', border: 'border-cyber-amber/30' },
}

function PatternBadge({ type }) {
    const c = PATTERN_COLOR[type] || { bg: 'bg-slate-700/20', text: 'text-slate-400', border: 'border-slate-600/30' }
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${c.bg} ${c.text} ${c.border}`}>
            {type.replace('_', ' ')}
        </span>
    )
}

function ScoreBadge({ score }) {
    const cls =
        score >= 70 ? 'risk-high' :
            score >= 30 ? 'risk-medium' : 'risk-low'
    return (
        <span className={`${cls} border rounded-full px-2 py-0.5 text-xs font-mono font-bold`}>
            {score?.toFixed(1)}
        </span>
    )
}

export default function FraudRingTable({ rings, loading }) {
    return (
        <div className="mt-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-cyber-red" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">
                    Fraud Ring Intelligence
                </h2>
                {rings.length > 0 && (
                    <span className="ml-auto font-mono text-xs text-cyber-red font-semibold">
                        {rings.length} ring{rings.length !== 1 ? 's' : ''} detected
                    </span>
                )}
            </div>

            {loading && (
                <div className="shimmer rounded-xl h-32" />
            )}

            {!loading && rings.length === 0 && (
                <div className="glass-card rounded-xl border border-cyber-border p-6 text-center">
                    <p className="text-slate-600 font-mono text-sm">No fraud rings detected in this dataset.</p>
                </div>
            )}

            {!loading && rings.length > 0 && (
                <div className="glass-card rounded-xl border border-cyber-border overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-cyber-border/60 bg-cyber-slate/60">
                        <span className="col-span-3 font-mono text-[10px] text-slate-500 uppercase tracking-widest">Ring ID</span>
                        <span className="col-span-2 font-mono text-[10px] text-slate-500 uppercase tracking-widest">Pattern</span>
                        <span className="col-span-1 font-mono text-[10px] text-slate-500 uppercase tracking-widest text-center">Members</span>
                        <span className="col-span-1 font-mono text-[10px] text-slate-500 uppercase tracking-widest text-center">Risk</span>
                        <span className="col-span-5 font-mono text-[10px] text-slate-500 uppercase tracking-widest">Member Account IDs</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-cyber-border/40">
                        {rings.map((ring, idx) => (
                            <div
                                key={ring.ring_id}
                                className={`grid grid-cols-12 gap-3 px-4 py-3 items-start hover:bg-cyber-slate/40 transition-colors ${idx === 0 ? 'bg-cyber-red/5' : ''
                                    }`}
                            >
                                {/* Ring ID */}
                                <div className="col-span-3">
                                    <span className="font-mono text-xs text-cyber-red font-semibold">
                                        {ring.ring_id}
                                    </span>
                                </div>

                                {/* Pattern */}
                                <div className="col-span-2">
                                    <PatternBadge type={ring.pattern_type} />
                                </div>

                                {/* Member count */}
                                <div className="col-span-1 flex items-center justify-center gap-1">
                                    <Users className="w-3 h-3 text-slate-500" />
                                    <span className="font-mono text-xs text-slate-300">{ring.member_accounts.length}</span>
                                </div>

                                {/* Risk score */}
                                <div className="col-span-1 flex justify-center">
                                    <ScoreBadge score={ring.risk_score} />
                                </div>

                                {/* Member Account IDs */}
                                <div className="col-span-5">
                                    <p className="font-mono text-[10px] text-slate-400 leading-relaxed break-all">
                                        {ring.member_accounts.join(', ')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && rings.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-slate-600" />
                    <span className="font-mono text-[10px] text-slate-600">
                        Rings identified via Strongly Connected Components (SCC) · Ring risk = avg member suspicion score
                    </span>
                </div>
            )}
        </div>
    )
}
