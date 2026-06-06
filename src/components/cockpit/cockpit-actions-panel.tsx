"use client";

import { ArrowRight } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { Button } from "@/components/ui/button";
import { MrrCheckIn } from "@/components/cockpit/mrr-check-in";
import { ManualMetricsDialog } from "@/components/cockpit/manual-metrics-dialog";
import { cn } from "@/lib/utils";

type CockpitActionsPanelProps = {
  project: UserProject;
  opportunity: Opportunity;
  data: CockpitData;
  onRecordMrr: (amount: number, note?: string) => void;
  onLogMetrics: (partial: Partial<import("@/lib/connectors/types").MetricsSnapshot>) => void;
  onModuleChange: (module: CockpitModuleId) => void;
};

export function CockpitActionsPanel({
  project,
  data,
  onRecordMrr,
  onLogMetrics,
  onModuleChange,
}: CockpitActionsPanelProps) {
  const topAction = data.radarActions[0];
  const disciplineScore = Math.min(100, project.checkInStreak * 25);

  return (
    <aside className="space-y-4">
      <MrrCheckIn project={project} onRecord={onRecordMrr} />

      {topAction ? (
        <section className="rounded-xl border border-primary/30 bg-accent/40 p-5">
          <p className="font-data text-[10px] uppercase tracking-data text-primary">
            Radar Intelligence
          </p>
          <p className="mt-2 text-sm font-medium">{topAction.title}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {topAction.rationale}
          </p>
          <Button
            className="mt-3 gap-2"
            size="sm"
            variant="outline"
            onClick={() => onModuleChange(topAction.actionModule)}
          >
            {topAction.actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      ) : null}

      {data.radarActions.length > 1 ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs font-medium text-muted-foreground">Autres actions</p>
          <ul className="mt-2 space-y-2">
            {data.radarActions.slice(1, 4).map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => onModuleChange(action.actionModule)}
                  className="w-full text-left text-xs hover:text-primary"
                >
                  {action.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium">Saisie manuelle</p>
          <ManualMetricsDialog onSubmit={onLogMetrics} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
          Score de discipline
        </p>
        <p className={cn("mt-2 text-3xl font-semibold", disciplineScore >= 75 && "text-emerald-600")}>
          {disciplineScore} %
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Streak : {project.checkInStreak} mois consécutifs
        </p>
      </section>
    </aside>
  );
}
