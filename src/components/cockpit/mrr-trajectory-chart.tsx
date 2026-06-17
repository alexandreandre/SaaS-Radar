"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export type DualChartPoint = {
  month: number;
  projected: number;
  reality: number | null;
};

export function MrrTrajectoryChart({ data }: { data: DualChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} tickFormatter={(v) => `M${v}`} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value, name) => [
            value == null ? "—" : formatCurrency(Number(value)),
            name === "projected" ? "Projection fiche" : "Votre MRR",
          ]}
          labelFormatter={(l) => `Mois ${l}`}
        />
        <Legend
          formatter={(value) => (value === "projected" ? "Projection fiche" : "Votre MRR")}
        />
        <Line
          type="monotone"
          dataKey="projected"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          name="projected"
        />
        <Line
          type="monotone"
          dataKey="reality"
          stroke="#4a6f9a"
          strokeWidth={2.5}
          connectNulls={false}
          dot={{ r: 4, fill: "#4a6f9a" }}
          name="reality"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
