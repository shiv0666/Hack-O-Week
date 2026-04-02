function KpiCard({ title, value, unit, icon, tone = 'default', pulse = false }) {
  const IconComponent = icon
  const toneClasses = {
    default: 'border-slate-200 bg-white',
    ok: 'border-emerald-200 bg-emerald-50/60',
    alert: 'border-rose-300 bg-rose-50',
  }

  const valueClasses = {
    default: 'text-slate-900',
    ok: 'text-emerald-700',
    alert: 'text-rose-700',
  }

  return (
    <div
      className={[
        'rounded-2xl border p-5 shadow-sm transition-all duration-300',
        toneClasses[tone],
        pulse ? 'animate-alert-pulse' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <p className={["text-3xl font-semibold leading-none", valueClasses[tone]].join(' ')}>
              {value}
            </p>
            {unit ? <span className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{unit}</span> : null}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700">
          {IconComponent ? <IconComponent className="h-5 w-5" /> : null}
        </div>
      </div>
    </div>
  )
}

export default KpiCard
