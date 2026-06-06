"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export function RunwayChart({
  cashOnHand,
  burnRate,
  months = 12,
}: {
  cashOnHand: number;
  burnRate: number;
  months?: number;
}) {
  const data = Array.from({ length: months + 1 }, (_, i) => ({
    month: i,
    cash: Math.max(0, cashOnHand - burnRate * i),
  }));

  const zeroMonth = data.findIndex((d) => d.cash <= 0);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString("fr-FR")} €`} labelFormatter={(l) => `Mois ${l}`} />
        {zeroMonth > 0 ? (
          <ReferenceLine x={zeroMonth} stroke="#ef4444" strokeDasharray="4 4" label="Runway" />
        ) : null}
        <Line type="monotone" dataKey="cash" stroke="#4a6f9a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
