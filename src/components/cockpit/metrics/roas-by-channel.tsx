"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { AdCampaign } from "@/lib/connectors/types";

export function RoasByChannelChart({ campaigns }: { campaigns: AdCampaign[] }) {
  const data = campaigns.map((c) => ({
    name: c.name.length > 20 ? `${c.name.slice(0, 18)}…` : c.name,
    roas: c.totalSpend > 0 ? Math.round(((c.conversions * 79) / c.totalSpend) * 100) / 100 : 0,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune campagne.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v) => `${v}x ROAS`} />
        <Bar dataKey="roas" fill="#4a6f9a" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
