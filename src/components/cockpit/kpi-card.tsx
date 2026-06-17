"use client";

import { motion } from "framer-motion";
import {
  Clock,
  DollarSign,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { CockpitKpi } from "@/lib/cockpit-metrics";
import { cn } from "@/lib/utils";

const KPI_ICONS: Record<string, LucideIcon> = {
  mrr: DollarSign,
  arr: DollarSign,
  customers: Users,
  mau: Users,
  signups: Users,
  trials: Users,
  dau: Users,
  activeUsers: Users,
  stickiness: Percent,
  trialToPaid: Percent,
  cac: DollarSign,
  ltv: DollarSign,
  ltvCac: Target,
  churn: Percent,
  roas: TrendingUp,
  runway: Clock,
  target: Target,
  arpu: DollarSign,
  nrr: Percent,
};

type KpiCardProps = {
  kpi: CockpitKpi;
  index?: number;
  variant?: "default" | "hero" | "compact";
  sourceBadge?: string;
  targetProgressPct?: number;
  targetLabel?: string;
  runwayMonths?: number | null;
};

function DeltaBadge({
  delta,
  invert,
}: {
  delta: number;
  invert?: boolean;
}) {
  const positive = delta >= 0;
  const good = invert ? !positive : positive;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
        good ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}
      {delta} %
    </span>
  );
}

function Sparkline({ data, height = 40 }: { data: number[]; height?: number }) {
  const flat = data.length <= 1 ? [...data, data[0] ?? 0] : data;
  const chartColor = "#4a6f9a";

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={flat.map((v, i) => ({ i, v }))}>
          <defs>
            <linearGradient id="kpiSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={chartColor}
            strokeWidth={1.5}
            fill="url(#kpiSpark)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiCard({
  kpi,
  index = 0,
  variant = "default",
  sourceBadge,
  targetProgressPct,
  targetLabel,
  runwayMonths,
}: KpiCardProps) {
  const invertDelta = kpi.key === "cac" || kpi.key === "churn";
  const Icon = KPI_ICONS[kpi.key] ?? DollarSign;
  const isRunwayCritical =
    kpi.key === "runway" && runwayMonths != null && runwayMonths < 3;
  const isRunwayWarning =
    kpi.key === "runway" &&
    runwayMonths != null &&
    runwayMonths >= 3 &&
    runwayMonths < 6;

  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-5 shadow-card"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
                {kpi.label}
              </p>
              {sourceBadge ? (
                <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {sourceBadge}
                </span>
              ) : null}
            </div>
          </div>
          {kpi.delta !== null ? <DeltaBadge delta={kpi.delta} invert={invertDelta} /> : null}
        </div>

        <p className="mt-3 font-display text-3xl font-medium tabular-nums tracking-tight">
          {kpi.value}
        </p>

        {kpi.sparkline.length > 0 ? (
          <div className="mt-3 h-16">
            <Sparkline data={kpi.sparkline} height={64} />
          </div>
        ) : null}

        {targetProgressPct !== undefined && targetLabel ? (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Objectif Radar</span>
              <span className="font-medium tabular-nums">{targetLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, targetProgressPct)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
              {targetProgressPct} % de l&apos;objectif
            </p>
          </div>
        ) : null}
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card",
          isRunwayCritical && "border-destructive/40 bg-destructive/5",
          isRunwayWarning && "border-amber-500/40 bg-amber-500/5"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
              isRunwayCritical && "bg-destructive/15 text-destructive",
              isRunwayWarning && "bg-amber-500/15 text-amber-700"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
              {kpi.label}
            </p>
            <p
              className={cn(
                "font-data text-lg font-semibold tabular-nums",
                isRunwayCritical && "text-destructive",
                isRunwayWarning && "text-amber-700"
              )}
            >
              {kpi.value}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {sourceBadge ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {sourceBadge}
            </span>
          ) : null}
          {kpi.delta !== null ? (
            <DeltaBadge delta={kpi.delta} invert={invertDelta} />
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-card",
        isRunwayCritical && "border-destructive/40 bg-destructive/5",
        isRunwayWarning && "border-amber-500/40 bg-amber-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground",
              isRunwayCritical && "bg-destructive/15 text-destructive",
              isRunwayWarning && "bg-amber-500/15 text-amber-700"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
              {kpi.label}
            </p>
            {sourceBadge ? (
              <span className="mt-0.5 inline-block rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {sourceBadge}
              </span>
            ) : null}
          </div>
        </div>
        {kpi.delta !== null ? <DeltaBadge delta={kpi.delta} invert={invertDelta} /> : null}
      </div>

      <p
        className={cn(
          "mt-2 font-data text-xl font-semibold tabular-nums",
          isRunwayCritical && "text-destructive",
          isRunwayWarning && "text-amber-700"
        )}
      >
        {kpi.value}
      </p>

      {kpi.sparkline.length > 0 ? (
        <div className="mt-3 h-10">
          <Sparkline data={kpi.sparkline} />
        </div>
      ) : null}
    </motion.div>
  );
}
