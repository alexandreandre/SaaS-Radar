"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import { formatCurrency } from "@/lib/utils";

export function MrrBreakdownChart({ snapshots }: { snapshots: MetricsSnapshot[] }) {
  const data = snapshots.slice(-6).map((s) => ({
    date: s.date,
    Nouveau: s.newMrr,
    Expansion: s.expansionMrr,
    Churn: -s.churnedMrr,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Connectez un connecteur paiement ou saisissez vos métriques.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
        <Tooltip formatter={(v) => formatCurrency(Math.abs(Number(v)))} />
        <Legend />
        <Bar dataKey="Nouveau" stackId="a" fill="#4a6f9a" />
        <Bar dataKey="Expansion" stackId="a" fill="#10b981" />
        <Bar dataKey="Churn" stackId="a" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}
