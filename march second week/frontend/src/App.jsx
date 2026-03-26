import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/telemetry/daily";
const BAR_COLORS = ["#1d7af2", "#24b39d", "#ff7a45", "#8a5cf6", "#ffd166", "#3ec5ff"];

function buildApiUrl(filters) {
  const url = new URL(API_URL);
  if (filters.patientId) url.searchParams.set("patientId", filters.patientId);
  if (filters.startDate) url.searchParams.set("startDate", filters.startDate);
  if (filters.endDate) url.searchParams.set("endDate", filters.endDate);
  return url.toString();
}

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function App() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ patientId: "patient-001", startDate: "", endDate: "" });
  const [appliedFilters, setAppliedFilters] = useState({
    patientId: "patient-001",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    let isCancelled = false;

    async function fetchDailyTelemetry() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(buildApiUrl(appliedFilters));
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const payload = await response.json();
        console.log("Daily telemetry API response", payload);
        if (!payload || !Array.isArray(payload.data)) {
          throw new Error("Unexpected API response format");
        }

        if (!isCancelled) {
          setData(payload.data);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError(fetchError.message || "Failed to load dashboard data");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDailyTelemetry();

    return () => {
      isCancelled = true;
    };
  }, [appliedFilters]);

  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilters({
      patientId: filters.patientId.trim(),
      startDate: filters.startDate,
      endDate: filters.endDate
    });
  }

  function clearFilters() {
    const empty = { patientId: "", startDate: "", endDate: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  }

  const chartData = useMemo(
    () =>
      data.map((entry) => ({
        ...entry,
        dateLabel: formatDateLabel(entry.date)
      })),
    [data]
  );

  const metrics = useMemo(() => {
    if (!chartData.length) {
      return { days: 0, averageOfAverageHeartRate: 0, totalStepsAllDays: 0 };
    }

    const totalStepsAllDays = chartData.reduce((sum, item) => sum + item.totalSteps, 0);
    const averageOfAverageHeartRate = Math.round(
      chartData.reduce((sum, item) => sum + item.avgHeartRate, 0) / chartData.length
    );

    return {
      days: chartData.length,
      averageOfAverageHeartRate,
      totalStepsAllDays
    };
  }, [chartData]);

  return (
    <div className="page">
      <div className="grain" />
      <main className="dashboard">
        <header className="header">
          <p className="kicker">Telemetry Trends</p>
          <h1>Daily Health Activity Dashboard</h1>
        </header>

        <form className="filters" onSubmit={applyFilters}>
          <label>
            Patient ID
            <input
              type="text"
              value={filters.patientId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  patientId: event.target.value
                }))
              }
              placeholder="patient-001"
            />
          </label>

          <label>
            Start Date
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: event.target.value
                }))
              }
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: event.target.value
                }))
              }
            />
          </label>

          <div className="filterActions">
            <button type="submit">Apply</button>
            <button type="button" className="ghost" onClick={clearFilters}>
              Reset
            </button>
          </div>
        </form>

        {!isLoading && !error && chartData.length > 0 ? (
          <section className="metricGrid">
            <article className="metric metricPulse">
              <p>Tracked Days</p>
              <h3>{metrics.days}</h3>
            </article>
            <article className="metric metricHeart">
              <p>Overall Avg Heart Rate</p>
              <h3>{metrics.averageOfAverageHeartRate} bpm</h3>
            </article>
            <article className="metric metricSteps">
              <p>Total Steps in Range</p>
              <h3>{metrics.totalStepsAllDays.toLocaleString()}</h3>
            </article>
          </section>
        ) : null}

        {isLoading ? <div className="state">Loading daily telemetry data...</div> : null}

        {!isLoading && error ? (
          <div className="state error">Could not load dashboard: {error}</div>
        ) : null}

        {!isLoading && !error && chartData.length === 0 ? (
          <div className="state">No telemetry data available yet.</div>
        ) : null}

        {!isLoading && !error && chartData.length > 0 ? (
          <section className="charts">
            <article className="panel">
              <h2>Average Heart Rate per Day</h2>
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 20, left: 10, bottom: 8 }}>
                    <defs>
                      <linearGradient id="heartLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fd4f5a" />
                        <stop offset="100%" stopColor="#ff9b42" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(9, 16, 29, 0.2)" />
                    <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid rgba(20,40,58,0.15)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgHeartRate"
                      stroke="url(#heartLine)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel">
              <h2>Total Steps per Day</h2>
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 12, right: 20, left: 10, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(9, 16, 29, 0.2)" />
                    <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid rgba(20,40,58,0.15)" }}
                    />
                    <Bar dataKey="totalSteps" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`${entry.date}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}
