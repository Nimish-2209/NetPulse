"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export default function LatencyChart({ checks }) {
  const data = checks
    .slice()
    .reverse()
    .filter((check) => typeof check.latencyMs === "number")
    .map((check) => ({
      time: new Date(check.checkedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      latencyMs: check.latencyMs,
      status: check.status
    }));

  if (!data.length) {
    return <p className="empty-state">Run a check to start latency history.</p>;
  }

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#e6eaf1" strokeDasharray="4 4" />
          <XAxis dataKey="time" tick={{ fill: "#667085", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#667085", fontSize: 12 }}
            width={52}
            label={{ value: "ms", angle: -90, position: "insideLeft", fill: "#667085" }}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #d9dee8",
              borderRadius: 8,
              boxShadow: "0 12px 30px rgba(23, 32, 42, 0.12)"
            }}
          />
          <Line
            type="monotone"
            dataKey="latencyMs"
            stroke="#1f6feb"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
