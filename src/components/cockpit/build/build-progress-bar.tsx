"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getPlanDayRangeLabel } from "@/lib/guide-plan";
import { getRoadmapProgress, getPlanPaceStatus } from "@/lib/build-recipe";
import { getMilestoneProgress } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

type BuildProgressBarProps = {
  opportunity: Opportunity;
  project: UserProject;
};

export function BuildProgressBar({ opportunity, project }: BuildProgressBarProps) {
  const roadmapProgress = getRoadmapProgress(project, opportunity);
  const journalProgress = getMilestoneProgress(project);
  const pace = getPlanPaceStatus(project, opportunity);
  const planLabel = getPlanDayRangeLabel(opportunity.mvpPlan.roadmap);

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
            Progression build
          </p>
          <p className="mt-0.5 text-sm font-medium">{planLabel}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-center">
          <div>
            <p className="font-data text-lg font-semibold tabular-nums text-primary">
              {roadmapProgress.percent}%
            </p>
            <p className="text-[10px] text-muted-foreground">Roadmap</p>
          </div>
          <div>
            <p className="font-data text-lg font-semibold tabular-nums">{journalProgress}%</p>
            <p className="text-[10px] text-muted-foreground">Journal global</p>
          </div>
          <div>
            <p
              className={cn(
                "font-data text-lg font-semibold tabular-nums",
                pace.tone === "ahead" && "text-emerald-600",
                pace.tone === "behind" && "text-amber-600",
              )}
            >
              {pace.delta > 0 ? `+${pace.delta}` : pace.delta}
            </p>
            <p className="text-[10px] text-muted-foreground">Étapes vs plan</p>
          </div>
        </div>
      </div>
    </section>
  );
}
