function StatusRow({ label, value, valueTone = 'text-slate-700' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-2 last:border-b-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-sm font-semibold ${valueTone}`}>{value}</p>
    </div>
  )
}

function SystemStatusPanel({ isConnected, lastUpdate, totalAlerts }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-slate-900">System Status</h2>
      <StatusRow
        label="Connection"
        value={isConnected ? 'Connected' : 'Disconnected'}
        valueTone={isConnected ? 'text-emerald-700' : 'text-rose-700'}
      />
      <StatusRow label="Last Update" value={lastUpdate || 'Waiting for data'} />
      <StatusRow label="Total Alerts Triggered" value={String(totalAlerts)} />
    </div>
  )
}

export default SystemStatusPanel
