import { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'

export default function DropZone({ onFile, loading, fileName }) {
    const [isDragOver, setIsDragOver] = useState(false)

    const processFile = useCallback((file) => {
        if (!file) return
        if (!file.name.endsWith('.csv')) {
            alert('Only .csv files are accepted. Please check your file format.')
            return
        }
        onFile(file)
    }, [onFile])

    const onDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files[0]
        processFile(file)
    }, [processFile])

    const onDragOver = useCallback((e) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const onDragLeave = useCallback(() => setIsDragOver(false), [])

    const onInputChange = useCallback((e) => {
        processFile(e.target.files[0])
        e.target.value = ''
    }, [processFile])

    return (
        <div className="space-y-2">
            <label
                id="drop-zone"
                htmlFor="csv-file-input"
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`
          block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200
          ${isDragOver
                        ? 'border-cyber-red bg-cyber-red/10 scale-[0.98]'
                        : 'border-cyber-border/60 hover:border-cyber-red/40 hover:bg-cyber-red/5'
                    }
          ${loading ? 'opacity-60 pointer-events-none' : ''}
        `}
            >
                <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={onInputChange}
                    disabled={loading}
                />

                <div className="flex flex-col items-center gap-3">
                    {loading ? (
                        <>
                            <div className="w-10 h-10 border-2 border-cyber-red/40 border-t-cyber-red rounded-full animate-spin" />
                            <p className="text-xs font-mono text-slate-400">Analysing…</p>
                        </>
                    ) : isDragOver ? (
                        <>
                            <Upload className="w-8 h-8 text-cyber-red animate-bounce" />
                            <p className="text-sm font-mono text-cyber-red font-semibold">Drop to analyse</p>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-full bg-cyber-red/10 border border-cyber-red/30 flex items-center justify-center">
                                <Upload className="w-5 h-5 text-cyber-red" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white mb-1">Upload Transaction CSV</p>
                                <p className="text-xs text-slate-500 font-mono">Drag & drop or click to browse</p>
                            </div>
                        </>
                    )}
                </div>
            </label>

            {fileName && !loading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-gray border border-cyber-border">
                    <FileText className="w-3.5 h-3.5 text-cyber-blue-light shrink-0" />
                    <span className="font-mono text-xs text-slate-300 truncate flex-1">{fileName}</span>
                </div>
            )}

            <div className="px-1">
                <p className="text-[10px] font-mono text-slate-600 leading-relaxed">
                    Required columns: <span className="text-slate-500">transaction_id, sender_id, receiver_id, amount, timestamp</span>
                </p>
            </div>
        </div>
    )
}
