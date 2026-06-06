"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { Checkbox } from "@/components/ui/checkbox";

type LaunchJournalTrackerProps = {
  opportunity: Opportunity;
  project: UserProject;
  onToggle: (milestoneId: string) => void;
};

export function LaunchJournalTracker({
  opportunity,
  project,
  onToggle,
}: LaunchJournalTrackerProps) {
  const weeks = opportunity.launchTimeline ?? [];
  const launchMilestones = project.milestones.filter((m) => m.source === "launch");
  const revenueMilestones = project.milestones.filter((m) => m.source === "revenue");

  return (
    <div className="space-y-8">
      {weeks.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold">Semaine par semaine</h3>
          {weeks.map((week) => {
            const weekItems = launchMilestones.filter((m) => m.id.startsWith(`launch-w${week.week}-`));
            return (
              <details
                key={week.week}
                className="group rounded-lg border border-border bg-muted/30 open:bg-card"
                open={week.week === 1}
              >
                <summary className="cursor-pointer list-none px-4 py-3 font-medium">
                  <span className="font-data text-[10px] uppercase tracking-data text-primary">
                    Semaine {week.week}
                  </span>
                  <span className="ml-2">{week.goal}</span>
                </summary>
                <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
                  {weekItems.map((milestone) => (
                    <label
                      key={milestone.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={milestone.done}
                        onCheckedChange={() => onToggle(milestone.id)}
                        className="mt-0.5"
                      />
                      <span className={milestone.done ? "text-muted-foreground line-through" : ""}>
                        {milestone.label.replace(/^S\d+ — /, "")}
                      </span>
                    </label>
                  ))}
                  <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
                    KPI : <span className="text-foreground">{week.kpi}</span>
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      ) : null}

      <div>
        <h3 className="font-semibold">Jalons revenus</h3>
        <div className="mt-4 space-y-2">
          {revenueMilestones.map((milestone) => (
            <label
              key={milestone.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
            >
              <Checkbox
                checked={milestone.done}
                onCheckedChange={() => onToggle(milestone.id)}
              />
              <span className={milestone.done ? "text-muted-foreground line-through" : ""}>
                {milestone.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {opportunity.mvpPlan.stack.length > 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <p className="font-medium">Stack conseillée</p>
          <p className="mt-2 text-muted-foreground">{opportunity.mvpPlan.stack.join(" · ")}</p>
        </div>
      ) : null}
    </div>
  );
}
