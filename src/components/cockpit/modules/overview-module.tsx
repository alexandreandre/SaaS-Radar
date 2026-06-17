"use client";

import { KpiGrid } from "@/components/cockpit/kpi-grid";
import { AlertsPanel } from "@/components/cockpit/alerts-panel";
import { NextActionCard } from "@/components/cockpit/next-action-card";
import { ManualMetricsDialog } from "@/components/cockpit/manual-metrics-dialog";
import { StackHealthBar } from "@/components/cockpit/stack-health-bar";
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
        <p className="label-data">Tableau de bord</p>
        <ManualMetricsDialog onSubmit={onLogMetrics} />
      </div>
      <KpiGrid metrics={data.metrics} />

      <StackHealthBar stackHealth={data.stackHealth} onModuleChange={onModuleChange} />

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
