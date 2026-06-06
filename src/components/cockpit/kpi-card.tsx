"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { CockpitKpi } from "@/lib/cockpit-metrics";
import { cn } from "@/lib/utils";

export function KpiCard({ kpi, index = 0 }: { kpi: CockpitKpi; index?: number }) {
  const positive = kpi.delta !== null && kpi.delta >= 0;
  const invertDelta = kpi.key === "cac" || kpi.key === "churn";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-border bg-card p-4 shadow-card"
    >
      <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
        {kpi.label}
      </p>
      <p className="mt-1 font-data text-xl font-semibold tabular-nums">{kpi.value}</p>
      {kpi.delta !== null ? (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            (positive && !invertDelta) || (!positive && invertDelta)
              ? "text-emerald-600"
              : "text-red-600"
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {kpi.delta >= 0 ? "+" : ""}
          {kpi.delta} % vs mois préc.
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">—</p>
      )}
      {kpi.sparkline.length > 1 ? (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpi.sparkline.map((v, i) => ({ i, v }))}>
              <Line type="monotone" dataKey="v" stroke="#4a6f9a" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </motion.div>
  );
}
