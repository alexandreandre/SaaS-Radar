"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AdCampaign } from "@/lib/connectors/types";
import { formatCurrency } from "@/lib/utils";

export function SpendByChannelChart({ campaigns }: { campaigns: AdCampaign[] }) {
  const byChannel = campaigns.reduce(
    (acc, c) => {
      const key = c.channel;
      acc[key] = (acc[key] ?? 0) + c.totalSpend;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(byChannel).map(([channel, spend]) => ({
    channel: channel.charAt(0).toUpperCase() + channel.slice(1),
    spend,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune campagne enregistrée.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Area type="monotone" dataKey="spend" stroke="#4a6f9a" fill="#4a6f9a" fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
