"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { ProductStream } from "@/lib/connectors/streams";
import { getProductFunnel } from "@/lib/portfolio";

const COLORS = ["#94a3b8", "#64748b", "#4a6f9a", "#2d4a6a"];

export function ProductFunnelChart({
  snapshot,
  productStream,
}: {
  snapshot: MetricsSnapshot;
  productStream?: ProductStream;
}) {
  const activationRate = productStream?.type === "product" ? productStream.activationRate : undefined;
  const data = getProductFunnel(snapshot, activationRate);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pas encore de données produit — signups ou trials requis.
      </p>
    );
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
