"use client";

import { KpiGrid } from "@/components/cockpit/kpi-grid";
import { AlertsPanel } from "@/components/cockpit/alerts-panel";
import { PromiseVsRealityChart } from "@/components/cockpit/promise-vs-reality-chart";
import { NextActionCard } from "@/components/cockpit/next-action-card";
import { ManualMetricsDialog } from "@/components/cockpit/manual-metrics-dialog";
import { StackHealthBar } from "@/components/cockpit/stack-health-bar";
import { GapCallout } from "@/components/cockpit/ui/gap-callout";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function OverviewModule({
  project,
  opportunity,
  data,
  onLogMetrics,
  onModuleChange,
}: CockpitModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-data">KPIs du mois</p>
        <ManualMetricsDialog onSubmit={onLogMetrics} />
      </div>
      <KpiGrid kpis={data.metrics.kpis} />

      <StackHealthBar stackHealth={data.stackHealth} onModuleChange={onModuleChange} />

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-primary">
              Promesse vs Réalité
            </p>
            <h2 className="mt-1 text-lg font-semibold">Trajectoire sur 12 mois</h2>
          </div>
          <p className="font-data text-sm text-muted-foreground">
            Journal {data.milestoneProgress} %
          </p>
        </div>
        <div className="mt-4">
          <PromiseVsRealityChart data={data.chartData} />
        </div>
        <GapCallout
          gap={data.gap}
          target={data.target}
          currentMrr={project.currentMrr}
          scenario={project.targetScenario}
        />
      </section>

      <section>
        <p className="mb-3 font-semibold">Alertes</p>
        <AlertsPanel alerts={data.alerts} onModuleChange={onModuleChange} />
      </section>

      <NextActionCard
        project={project}
        opportunity={opportunity}
        radarAction={data.radarActions[0]}
        onModuleChange={onModuleChange}
      />
    </div>
  );
}
