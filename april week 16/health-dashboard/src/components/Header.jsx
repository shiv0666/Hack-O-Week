function Header() {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
        Health Intelligence Console
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        Real-Time Health Monitoring Dashboard
      </h1>
      <p className="mt-2 text-sm text-slate-600 md:text-base">
        Live telemetry monitoring with anomaly detection
      </p>
    </header>
  )
}

export default Header
