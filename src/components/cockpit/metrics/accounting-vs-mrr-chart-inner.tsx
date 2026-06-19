"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AccountingStream } from "@/lib/connectors/streams";
import { formatCurrency } from "@/lib/utils";

export function AccountingVsMrrChartInner({
  mrr,
  accounting,
}: {
  mrr: number;
  accounting: AccountingStream;
}) {
  const data = [
    {
      name: "Ce mois",
      mrr,
      comptable: accounting.revenueBooked,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Legend />
        <Bar dataKey="mrr" name="MRR Stripe" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="comptable" name="CA comptable" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
