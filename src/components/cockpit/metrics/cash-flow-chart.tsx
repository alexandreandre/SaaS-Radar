"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinanceStream } from "@/lib/connectors/streams";
import { formatCurrency } from "@/lib/utils";

export function CashFlowChart({ stream }: { stream: FinanceStream }) {
  const data = [
    { name: "Entrées", value: stream.monthlyInflow },
    { name: "Sorties", value: stream.monthlyOutflow },
    { name: "Solde", value: stream.cashBalance },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
