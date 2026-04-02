function AlertsPanel({ alerts }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Alerts</h2>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
          {alerts.length}
        </span>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            No active alerts.
          </p>
        ) : (
          alerts.map((alert, index) => (
            <article
              key={`${alert.timestamp}-${index}`}
              className="rounded-xl border border-rose-200 bg-rose-50 p-3"
            >
              <p className="text-sm font-semibold text-rose-800">{alert.message}</p>
              <p className="mt-1 text-sm font-bold text-rose-700">{alert.value}</p>
              <p className="mt-1 text-xs text-rose-600">{alert.timestamp}</p>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export default AlertsPanel
