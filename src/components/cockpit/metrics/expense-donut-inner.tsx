"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Expense } from "@/lib/connectors/types";

const COLORS = ["#4a6f9a", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"];
const LABELS: Record<string, string> = {
  infra: "Infra",
  ads: "Pubs",
  tools: "Outils",
  salary: "Salaires",
  other: "Autre",
};

export function ExpenseDonutChartInner({ expenses }: { expenses: Expense[] }) {
  const byCategory = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(byCategory).map(([category, value]) => ({
    name: LABELS[category] ?? category,
    value,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune dépense enregistrée.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${Number(v).toLocaleString("fr-FR")} €`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
