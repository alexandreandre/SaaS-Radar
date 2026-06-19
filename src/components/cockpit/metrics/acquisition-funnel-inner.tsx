"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import { getFunnel } from "@/lib/portfolio";

const COLORS = ["#94a3b8", "#64748b", "#4a6f9a", "#3b5a7a", "#2d4a6a"];

export function AcquisitionFunnelChartInner({ snapshot }: { snapshot: MetricsSnapshot }) {
  const data = getFunnel(snapshot).filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Pas encore de données d&apos;acquisition.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="stage" width={90} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
