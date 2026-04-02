import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function HeartRateChart({ data }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Heart Rate Over Time</h2>
        <p className="text-xs text-slate-500">Live trend for the latest telemetry window</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ef" />
            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} domain={[50, 'dataMax + 10']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#dbe4ef',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke="#0284c7"
              strokeWidth={3}
              dot={false}
              isAnimationActive
              animationDuration={450}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default HeartRateChart
