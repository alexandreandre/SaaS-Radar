"use client";

import { formatCurrency } from "@/lib/utils";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import { cn } from "@/lib/utils";

type CockpitPulseBarProps = {
  data: CockpitData;
  hasDemoData: boolean;
};

export function CockpitPulseBar({ data, hasDemoData }: CockpitPulseBarProps) {
  const { metrics, criticalAlerts, gap } = data;
  const latest = metrics.latest;

  const tiles = [
    {
      label: "MRR",
      value: formatCurrency(latest?.mrr ?? 0),
      sub: hasDemoData ? "démo" : "live",
    },
    {
      label: "Promesse",
      value: gap !== null && gap >= 0 ? `+${gap} %` : gap !== null ? `${gap} %` : "—",
      sub: `${metrics.promiseProgressPct} % objectif`,
    },
    {
      label: "Clients",
      value: String(latest?.customers ?? 0),
      sub: metrics.hasDemoData ? "sync" : "manuel",
    },
    {
      label: "Runway",
      value: metrics.runwayMonths !== null ? `${metrics.runwayMonths} mois` : "—",
      sub: "trésorerie",
    },
    {
      label: "ROAS",
      value: `${metrics.roas}x`,
      sub: "acquisition",
    },
    {
      label: "Alertes",
      value: String(criticalAlerts),
      sub: criticalAlerts > 0 ? "critiques" : "OK",
      alert: criticalAlerts > 0,
    },
  ];

  return (
    <div className="sticky top-16 z-20 -mx-4 border-y border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={cn(
              "rounded-lg border border-border bg-card px-3 py-2",
              tile.alert && "border-red-500/40 bg-red-500/5"
            )}
          >
            <p className="font-data text-[9px] uppercase tracking-data text-muted-foreground">
              {tile.label}
            </p>
            <p className="font-data text-sm font-semibold tabular-nums">{tile.value}</p>
            <p className="text-[10px] text-muted-foreground">{tile.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
