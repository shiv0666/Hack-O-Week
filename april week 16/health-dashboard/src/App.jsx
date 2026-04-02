import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowTrendingUpIcon, HeartIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import Header from './components/Header'
import KpiCard from './components/KpiCard'
import HeartRateChart from './components/charts/HeartRateChart'
import StepsChart from './components/charts/StepsChart'
import AlertsPanel from './components/AlertsPanel'
import SystemStatusPanel from './components/SystemStatusPanel'
import LiveLogsPanel from './components/LiveLogsPanel'

const TELEMETRY_SOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/telemetry'
const ALERT_HEART_RATE = 120

const formatClock = (rawTimestamp) => {
  if (!rawTimestamp) {
    return new Date().toLocaleTimeString()
  }

  const parsed = new Date(rawTimestamp)
  return Number.isNaN(parsed.getTime()) ? new Date().toLocaleTimeString() : parsed.toLocaleTimeString()
}

function App() {
  const [heartRate, setHeartRate] = useState(0)
  const [steps, setSteps] = useState(0)
  const [alerts, setAlerts] = useState([])
  const [logs, setLogs] = useState([])
  const [chartData, setChartData] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [alertPulse, setAlertPulse] = useState(false)

  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)

  const appendLog = useCallback((entry) => {
    setLogs((current) => [entry, ...current].slice(0, 200))
  }, [])

  const pushAlert = useCallback((message, value, timestamp) => {
    const formattedTime = formatClock(timestamp)
    setAlerts((current) => [{ message, value, timestamp: formattedTime }, ...current].slice(0, 100))
    appendLog(`[ALERT] ${message} :: ${value} (${formattedTime})`)
    setAlertPulse(true)
    window.setTimeout(() => setAlertPulse(false), 800)
  }, [appendLog])

  useEffect(() => {
    const connect = () => {
      const socket = new WebSocket(TELEMETRY_SOCKET_URL)
      wsRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        appendLog('[INFO] WebSocket connected')
      }

      socket.onclose = () => {
        setIsConnected(false)
        appendLog('[WARN] WebSocket disconnected. Reconnecting...')
        reconnectTimerRef.current = window.setTimeout(connect, 3000)
      }

      socket.onerror = () => {
        appendLog('[ERROR] WebSocket encountered an error')
      }

      socket.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data)

          if (packet.type === 'alert') {
            pushAlert(packet.message || 'High Heart Rate Detected', packet.value || 'N/A', packet.timestamp)
            return
          }

          const nextHeartRate = Number(packet.heartRate || 0)
          const nextSteps = Number(packet.steps || 0)
          const nextTime = formatClock(packet.timestamp)

          setHeartRate(nextHeartRate)
          setSteps(nextSteps)
          setLastUpdate(nextTime)
          setIsLoading(false)
          appendLog('[INFO] Data received')

          setChartData((current) => [...current, { time: nextTime, heartRate: nextHeartRate, steps: nextSteps }].slice(-30))

          if (nextHeartRate > ALERT_HEART_RATE) {
            pushAlert('High Heart Rate Detected', `${nextHeartRate} BPM`, packet.timestamp)
          }
        } catch {
          appendLog('[ERROR] Invalid telemetry payload received')
        }
      }
    }

    connect()

    return () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
      }

      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [appendLog, pushAlert])

  const statusText = useMemo(() => {
    return heartRate > ALERT_HEART_RATE || alerts.length > 0 ? 'Alert' : 'Normal'
  }, [alerts.length, heartRate])

  const stepsChartData = useMemo(() => chartData.slice(-12), [chartData])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#dff3ff_0%,_#f8fafc_40%,_#eef2f7_100%)] px-4 py-6 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header />

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-600">Connecting to telemetry stream...</p>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard
            title="Heart Rate"
            value={heartRate || '--'}
            unit="BPM"
            icon={HeartIcon}
            tone={heartRate > ALERT_HEART_RATE ? 'alert' : 'ok'}
            pulse={heartRate > ALERT_HEART_RATE}
          />
          <KpiCard title="Steps" value={steps || '--'} icon={ArrowTrendingUpIcon} tone="default" />
          <KpiCard
            title="Status"
            value={statusText}
            icon={ShieldCheckIcon}
            tone={statusText === 'Alert' ? 'alert' : 'ok'}
            pulse={alertPulse}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-10">
          <div className="space-y-4 xl:col-span-7">
            <HeartRateChart data={chartData} />
            <StepsChart data={stepsChartData} />
          </div>

          <aside className="space-y-4 xl:col-span-3">
            <AlertsPanel alerts={alerts} />
            <SystemStatusPanel
              isConnected={isConnected}
              lastUpdate={lastUpdate}
              totalAlerts={alerts.length}
            />
          </aside>
        </section>

        <LiveLogsPanel logs={logs} />
      </div>
    </main>
  )
}

export default App
