function LiveLogsPanel({ logs }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-slate-100">Live Logs</h2>
      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/90 p-3 font-mono text-xs text-emerald-300">
        {logs.length === 0 ? (
          <p className="text-slate-500">[INFO] Waiting for telemetry stream...</p>
        ) : (
          logs.map((entry, index) => (
            <p key={`${entry}-${index}`} className="mb-1 last:mb-0">
              {entry}
            </p>
          ))
        )}
      </div>
    </section>
  )
}

export default LiveLogsPanel
