"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import { getEngagementSeries } from "@/lib/portfolio";

export function EngagementTrendChartInner({ history }: { history: MetricsSnapshot[] }) {
  const data = getEngagementSeries(history);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pas encore de données d&apos;engagement — saisissez vos métriques ou connectez un analytics.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="signups" name="Signups" stroke="#64748b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="mau" name="MAU" stroke="#4a6f9a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="dau" name="DAU" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
