import { Activity, GitBranch, Network, Clock, Shield, ChevronRight, Zap, Eye, Database } from 'lucide-react'

const features = [
    {
        icon: GitBranch,
        title: 'Cycle Detection',
        tag: 'SCC Algorithm',
        color: 'text-cyber-red',
        border: 'border-cyber-red',
        bg: 'bg-cyber-red-glow',
        description:
            'Identifies money laundering loops (A→B→C→A) using Kosaraju\'s Strongly Connected Components algorithm — the cryptographic signature of circular fund movement.',
    },
    {
        icon: Network,
        title: 'Hub / Smurfing Detection',
        tag: 'Degree Centrality',
        color: 'text-cyber-blue-light',
        border: 'border-cyber-blue',
        bg: 'bg-cyber-blue-glow',
        description:
            'Calculates in-degree and out-degree centrality to expose "smurfing" aggregators — accounts that receive from many sources and fan out to many destinations.',
    },
    {
        icon: Clock,
        title: 'Temporal Analysis',
        tag: 'Hot Potato Pattern',
        color: 'text-cyber-amber',
        border: 'border-cyber-amber',
        bg: 'bg-amber-500/10',
        description:
            'Flags accounts transferring >90% of received funds within a 10-minute window — the forensic hallmark of a pass-through mule minimising dwell time.',
    },
]

const stats = [
    { label: 'Graph Nodes', value: '∞', sub: 'Accounts modelled' },
    { label: 'Risk Engine', value: '3', sub: 'Detection layers' },
    { label: 'Time Window', value: '10m', sub: 'Temporal threshold' },
    { label: 'Pass-through', value: '>90%', sub: 'Flag trigger' },
]

export default function LandingPage({ onEnterLab }) {
    return (
        <div className="min-h-screen bg-cyber-black grid-bg relative overflow-hidden">
            {/* Scan line */}
            <div className="scan-line" />

            {/* Background glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-red/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-blue/5 rounded-full blur-3xl pointer-events-none" />

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-cyber-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyber-red rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-mono text-sm font-semibold text-white tracking-widest uppercase">
                        RIFT<span className="text-cyber-red">2026</span>
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">Cybersecurity Track</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyber-green/40 bg-cyber-green/10">
                        <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse" />
                        <span className="text-cyber-green font-mono text-xs">Engine Online</span>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative z-10 max-w-6xl mx-auto px-8 pt-20 pb-16 text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-red/30 bg-cyber-red/10 mb-8">
                    <Zap className="w-3.5 h-3.5 text-cyber-red" />
                    <span className="font-mono text-xs text-cyber-red tracking-widest uppercase">
                        Financial Forensic Engine · Graph Intelligence
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none mb-6">
                    Follow the{' '}
                    <span className="gradient-text-red animate-glow">Flow</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed mb-4">
                    Graph-Based Intelligence for{' '}
                    <span className="text-white font-medium">Money Mule Detection</span>
                </p>
                <p className="text-sm text-slate-600 font-mono max-w-xl mx-auto mb-12">
                    Upload a transaction CSV → The engine builds a directed graph → Three forensic algorithms surface hidden criminal networks in seconds.
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        id="enter-lab-btn"
                        onClick={onEnterLab}
                        className="group flex items-center gap-3 px-8 py-4 bg-cyber-red hover:bg-cyber-red-dark text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyber-red/30 hover:scale-105"
                    >
                        <Eye className="w-5 h-5" />
                        Enter The Lab
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-mono">
                        <Activity className="w-4 h-4 text-cyber-green animate-pulse" />
                        Demo mode loads automatically
                    </div>
                </div>
            </section>

            {/* Stats row */}
            <section className="relative z-10 max-w-6xl mx-auto px-8 mb-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((s) => (
                        <div key={s.label} className="glass-card rounded-xl p-5 text-center">
                            <div className="text-3xl font-black text-white font-mono mb-1">{s.value}</div>
                            <div className="text-xs font-semibold text-cyber-red uppercase tracking-widest mb-0.5">{s.label}</div>
                            <div className="text-xs text-slate-500">{s.sub}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Feature cards */}
            <section className="relative z-10 max-w-6xl mx-auto px-8 pb-24">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-white mb-2">Three-Layer Forensic Engine</h2>
                    <p className="text-slate-500 text-sm font-mono">Each algorithm contributes to a composite risk score (0–100)</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {features.map(({ icon: Icon, title, tag, color, border, bg, description }) => (
                        <div
                            key={title}
                            className={`glass-card rounded-xl p-6 border hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                        >
                            <div className={`w-12 h-12 rounded-lg ${bg} border ${border} flex items-center justify-center mb-4`}>
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                            <div className={`inline-block font-mono text-xs px-2 py-0.5 rounded border ${border} ${color} bg-transparent mb-3`}>
                                {tag}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="relative z-10 max-w-6xl mx-auto px-8 pb-24">
                <div className="glass-card rounded-2xl p-8 border border-cyber-border">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="w-5 h-5 text-cyber-red" />
                        <h2 className="text-xl font-bold text-white">How the Engine Works</h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { step: '01', label: 'Ingest CSV', desc: 'Pandas reads your transaction_id, sender_id, receiver_id, amount, timestamp columns' },
                            { step: '02', label: 'Build Graph', desc: 'NetworkX constructs a Directed Graph where every transaction is a weighted edge' },
                            { step: '03', label: 'Run Algorithms', desc: 'Cycle detection (SCC), hub centrality, and temporal pass-through analysis execute in parallel' },
                            { step: '04', label: 'Score & Surface', desc: 'Risk scores 0–100 are assigned, graph visualised, top suspects ranked in the Evidence Locker' },
                        ].map(({ step, label, desc }) => (
                            <div key={step} className="relative">
                                <div className="font-mono text-4xl font-black text-cyber-red/20 mb-2">{step}</div>
                                <h4 className="font-semibold text-white mb-2">{label}</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-cyber-border/50 py-6 text-center">
                <p className="font-mono text-xs text-slate-600">
                    RIFT 2026 · Cybersecurity Track · Follow the Flow (Money Muling Detection) ·{' '}
                    <span className="text-cyber-red">Graph Intelligence Engine</span>
                </p>
            </footer>
        </div>
    )
}
