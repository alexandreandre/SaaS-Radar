"use client";

import { Lock } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  getCurrentWeek,
  getWeekMilestones,
  shouldShowRevenueMilestones,
} from "@/lib/build-launch";
import { Checkbox } from "@/components/ui/checkbox";

type WeekTrackerProps = {
  opportunity: Opportunity;
  project: UserProject;
  onToggle: (milestoneId: string) => void;
  heroMilestoneId?: string | null;
  onOpenCampaign?: () => void;
};

export function WeekTracker({
  opportunity,
  project,
  onToggle,
  heroMilestoneId,
  onOpenCampaign,
}: WeekTrackerProps) {
  const weeks = opportunity.launchTimeline ?? [];
  const currentWeek = getCurrentWeek(project, opportunity);
  const showRevenue = shouldShowRevenueMilestones(project, opportunity);
  const revenueMilestones = project.milestones.filter((m) => m.source === "revenue");

  const currentWeekItems = getWeekMilestones(project, currentWeek, opportunity).filter(
    (m) => m.id !== heroMilestoneId
  );

  const futureWeeks = weeks.filter((w) => w.week > currentWeek);

  return (
    <div className="space-y-4">
      {currentWeekItems.length > 0 ? (
        <details open className="group rounded-lg border border-border bg-card">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
            Cette semaine ({currentWeekItems.filter((m) => !m.done).length} restante
            {currentWeekItems.filter((m) => !m.done).length > 1 ? "s" : ""})
          </summary>
          <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
            {currentWeekItems.map((milestone) => (
              <label
                key={milestone.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
              >
                <Checkbox
                  checked={milestone.done}
                  onCheckedChange={() => onToggle(milestone.id)}
                  className="mt-0.5"
                />
                <span
                  className={milestone.done ? "text-muted-foreground line-through" : "text-sm"}
                >
                  {milestone.label.replace(/^S\d+ — /, "")}
                </span>
              </label>
            ))}
          </div>
        </details>
      ) : null}

      {futureWeeks.length > 0 ? (
        <details className="group rounded-lg border border-border bg-muted/20">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-muted-foreground">
            Semaines {futureWeeks[0].week}–{futureWeeks[futureWeeks.length - 1].week}
          </summary>
          <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
            {futureWeeks.map((week) => (
              <div
                key={week.week}
                className="flex items-start gap-2 rounded-lg border border-dashed border-border/80 p-3 opacity-60"
              >
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Semaine {week.week} · {week.goal}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    {week.actions.length} action{week.actions.length > 1 ? "s" : ""} · débloquée
                    après la semaine {week.week - 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {showRevenue ? (
        <details className="group rounded-lg border border-border bg-card">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
            Jalons revenus
          </summary>
          <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
            {revenueMilestones.map((milestone) => (
              <label
                key={milestone.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
              >
                <Checkbox
                  checked={milestone.done}
                  onCheckedChange={() => onToggle(milestone.id)}
                />
                <span className={milestone.done ? "text-muted-foreground line-through" : "text-sm"}>
                  {milestone.label}
                </span>
              </label>
            ))}
          </div>
        </details>
      ) : null}

      {onOpenCampaign ? (
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">
            Calendrier aligné avec le module Campagne — exécutez vos actions marketing.
          </p>
          <button
            type="button"
            onClick={onOpenCampaign}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Continuer dans Campagne
          </button>
        </div>
      ) : null}
    </div>
  );
}
