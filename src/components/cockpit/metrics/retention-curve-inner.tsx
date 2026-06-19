"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import { getRetentionSeries } from "@/lib/portfolio";

export function RetentionCurveChartInner({ history }: { history: MetricsSnapshot[] }) {
  const data = getRetentionSeries(history);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Historique insuffisant pour la rétention.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(v) => `${v} %`} />
        <Line type="monotone" dataKey="retention" stroke="#10b981" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
