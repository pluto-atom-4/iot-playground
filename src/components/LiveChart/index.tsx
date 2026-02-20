"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetryPoint } from "@/types/telemetry";

interface LiveChartProps {
  data: TelemetryPoint[];
  unit?: string;
  color?: string;
  height?: number;
}

export function LiveChart({ data, unit = "", color = "#3b82f6", height = 120 }: LiveChartProps) {
  const chartData = data.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString(),
    value: p.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          unit={unit}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.5rem" }}
          labelStyle={{ color: "#9ca3af", fontSize: 11 }}
          itemStyle={{ color: "#f3f4f6" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
