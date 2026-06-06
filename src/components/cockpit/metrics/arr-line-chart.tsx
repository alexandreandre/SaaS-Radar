"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import { formatCurrency } from "@/lib/utils";

export function ArrLineChart({ snapshots }: { snapshots: MetricsSnapshot[] }) {
  const data = snapshots.map((s) => ({
    date: s.date,
    arr: s.mrr * 12,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Pas de données ARR.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Line type="monotone" dataKey="arr" stroke="#4a6f9a" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
