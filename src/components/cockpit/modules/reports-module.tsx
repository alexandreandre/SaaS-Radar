"use client";

import { MonthlyReport } from "@/components/cockpit/monthly-report";
import { ShareMrrCard } from "@/components/cockpit/share-mrr-card";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function ReportsModule({ project, opportunity, data }: CockpitModuleProps) {
  return (
    <div className="space-y-6">
      <MonthlyReport project={project} opportunity={opportunity} metrics={data.metrics} />
      <ShareMrrCard project={project} projectName={opportunity.name} />
    </div>
  );
}
