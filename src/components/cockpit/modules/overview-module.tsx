"use client";

import { KpiGrid } from "@/components/cockpit/kpi-grid";
import { NextActionCard } from "@/components/cockpit/next-action-card";
import { ManualMetricsDialog } from "@/components/cockpit/manual-metrics-dialog";
import { ModuleCalloutsList } from "@/components/cockpit/module-callouts-list";
import { StackHealthBar } from "@/components/cockpit/stack-health-bar";
import { buildModuleCallouts } from "@/lib/cockpit-callouts";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function OverviewModule({
  project,
  opportunity,
  data,
  onLogMetrics,
  onModuleChange,
}: CockpitModuleProps) {
  const callouts = buildModuleCallouts("overview", project, opportunity, {
    stackHealth: data.stackHealth,
    alerts: data.alerts,
  });

  return (
    <div className="space-y-6">
      <ModuleCalloutsList callouts={callouts} onModuleChange={onModuleChange} />

      <KpiGrid metrics={data.metrics} />

      <StackHealthBar stackHealth={data.stackHealth} onModuleChange={onModuleChange} />

      <NextActionCard
        project={project}
        opportunity={opportunity}
        radarAction={data.radarActions[0]}
        onModuleChange={onModuleChange}
      />

      <div className="flex justify-end">
        <ManualMetricsDialog onSubmit={onLogMetrics} />
      </div>
    </div>
  );
}
