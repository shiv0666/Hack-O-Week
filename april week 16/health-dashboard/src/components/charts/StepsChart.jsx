import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function StepsChart({ data }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Steps Per Interval</h2>
        <p className="text-xs text-slate-500">Recent step updates from telemetry stream</p>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ef" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#dbe4ef',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="steps" fill="#0ea5e9" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={350} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default StepsChart
