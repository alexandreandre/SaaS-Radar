"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type ChartPoint = { month: number; mrr: number; customers: number };

export function SimulatorChart({
  data,
  breakEvenMonth,
}: {
  data: ChartPoint[];
  breakEvenMonth: number | null;
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} labelFormatter={(l) => `Mois ${l}`} />
        {breakEvenMonth && (
          <ReferenceLine x={breakEvenMonth} stroke="#4a6f9a" strokeDasharray="4 4" label="Break-even" />
        )}
        <Line type="monotone" dataKey="mrr" stroke="#4a6f9a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
