import { AlertTriangle, TrendingUp } from 'lucide-react'

const PATTERN_STYLES = {
    cycle: 'bg-cyber-red/10 text-cyber-red border-cyber-red/30',
    smurfing: 'bg-cyber-blue/10 text-cyber-blue-light border-cyber-blue/30',
    layering: 'bg-cyber-amber/10 text-cyber-amber border-cyber-amber/30',
}

function RiskBadge({ score }) {
    const cls =
        score >= 70 ? 'risk-high' :
            score >= 30 ? 'risk-medium' : 'risk-low'
    return (
        <span className={`${cls} border rounded-full px-2 py-0.5 text-xs font-mono font-bold`}>
            {score.toFixed(1)}
        </span>
    )
}

function RiskBar({ score }) {
    const color =
        score >= 70 ? 'bg-cyber-red' :
            score >= 30 ? 'bg-cyber-amber' : 'bg-cyber-blue'
    return (
        <div className="h-1 bg-cyber-gray rounded-full overflow-hidden">
            <div
                className={`h-full ${color} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, score)}%` }}
            />
        </div>
    )
}

export default function EvidenceLocker({ data, loading }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-cyber-red" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">
                    Evidence Locker
                </h2>
                <span className="ml-auto font-mono text-xs text-slate-500">Top 10</span>
            </div>

            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="shimmer rounded-lg h-16" />
                    ))}
                </div>
            )}

            {!loading && data.length === 0 && (
                <div className="text-center py-10 text-slate-600 font-mono text-sm">
                    No suspect accounts identified.
                </div>
            )}

            {!loading && data.length > 0 && (
                <div className="space-y-2">
                    {data.map((account, idx) => {
                        const score = account.suspicion_score ?? account.risk ?? 0
                        const flagList = account.detected_patterns ?? account.flags ?? []
                        return (
                            <div
                                key={account.id}
                                className={`glass-card rounded-lg p-3 border transition-all duration-200 hover:border-cyber-red/30 ${score >= 70 ? 'border-cyber-red/20' : 'border-cyber-border'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`font-mono text-xs font-bold w-5 shrink-0 mt-0.5 ${idx === 0 ? 'text-cyber-red' : idx < 3 ? 'text-cyber-amber' : 'text-slate-500'
                                        }`}>
                                        #{idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="font-mono text-xs font-semibold text-white truncate">
                                                {account.id}
                                            </span>
                                            <RiskBadge score={score} />
                                        </div>
                                        <RiskBar score={score} />
                                        {account.ring_id && (
                                            <p className="font-mono text-[10px] text-slate-500 mt-1">
                                                Ring: <span className="text-cyber-red">{account.ring_id}</span>
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {flagList.map(flag => (
                                                <span
                                                    key={flag}
                                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border capitalize ${PATTERN_STYLES[flag] || 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                                                        }`}
                                                >
                                                    {flag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {!loading && data.length > 0 && (
                <div className="mt-4 pt-3 border-t border-cyber-border/50 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-cyber-red" />
                    <span className="font-mono text-[10px] text-slate-500">
                        Weighted Heuristic Multiplier · Cycle +50 · Smurfing +5/sender · Velocity +20
                    </span>
                </div>
            )}
        </div>
    )
}
