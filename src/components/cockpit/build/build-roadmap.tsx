"use client";

import { ChevronRight, Clock, Target } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  getBuildStepMilestoneId,
  getCurrentBuildStepIndex,
  getRoadmapProgress,
  getWeekForRoadmapStep,
} from "@/lib/build-recipe";
import { getStepWeek } from "@/lib/guide-plan";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type BuildRoadmapProps = {
  opportunity: Opportunity;
  project: UserProject;
  onToggle: (milestoneId: string) => void;
};

function CompactTimelineStep({
  step,
  index,
  lastIndex,
  currentIndex,
  totalSteps,
  project,
  onToggle,
}: {
  step: Opportunity["mvpPlan"]["roadmap"][number];
  index: number;
  lastIndex: number;
  currentIndex: number;
  totalSteps: number;
  project: UserProject;
  onToggle: (id: string) => void;
}) {
  const milestoneId = getBuildStepMilestoneId(index);
  const milestone = project.milestones.find((m) => m.id === milestoneId);
  const isDone = milestone?.done ?? false;
  const isCurrent = index === currentIndex && !isDone;
  const isFuture = index > currentIndex && !isDone;
  const week = getStepWeek(step, index, totalSteps);

  if (isDone) {
    return (
      <div className="relative pl-10">
        <div className="absolute left-2.5 top-3.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-emerald-500 bg-emerald-500" />
        <details className="group">
          <summary className="cursor-pointer list-none rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground/70">{step.day}</span>
                <span className="ml-2 text-xs">· S{week} · terminé</span>
              </span>
              <span className="text-xs">Afficher</span>
            </div>
            <p className="mt-0.5 line-through">{step.objective ?? step.tasks[0]}</p>
          </summary>
          <div className="mt-2 rounded-lg border border-border bg-card p-3">
            <ul className="space-y-1">
              {step.tasks.map((task, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {task}
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="relative pl-10">
      <div
        className={cn(
          "absolute left-2.5 top-4 h-2.5 w-2.5 shrink-0 rounded-full border-2 ring-4 ring-background",
          isCurrent && "border-primary bg-primary",
          isFuture && "border-border bg-muted",
          index === 0 && !isCurrent && !isFuture && "border-emerald-500 bg-emerald-500",
          index === lastIndex && !isCurrent && "border-primary/60 bg-primary/60",
        )}
      />
      <div
        className={cn(
          "rounded-lg border bg-card p-3 transition-colors",
          isCurrent && "border-primary/40 ring-1 ring-primary/20",
          isFuture && "opacity-70",
          !isCurrent && "border-border",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{step.day}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-data text-[10px] uppercase tracking-data text-muted-foreground">
            S{week}
          </span>
          {step.estimateHours ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />~{step.estimateHours}h
            </span>
          ) : null}
          {isCurrent ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              En cours
            </span>
          ) : null}
          {index === lastIndex ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Lancement
            </span>
          ) : null}
        </div>
        <p className="mt-1 font-medium">{step.objective ?? step.tasks[0]}</p>

        {(isCurrent || index === lastIndex) && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {step.checkpoint ? (
              <div className="flex items-start gap-2 text-sm">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-muted-foreground">{step.checkpoint}</p>
              </div>
            ) : null}
            <ul className="space-y-1">
              {step.tasks.map((task, j) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {task}
                </li>
              ))}
            </ul>
            {isCurrent ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => onToggle(milestoneId)}
                />
                Étape terminée
              </label>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function BuildRoadmap({ opportunity, project, onToggle }: BuildRoadmapProps) {
  const { mvpPlan } = opportunity;
  const currentIndex = getCurrentBuildStepIndex(project, opportunity);
  const totalSteps = mvpPlan.roadmap.length;
  const lastIndex = totalSteps - 1;
  const progress = getRoadmapProgress(project, opportunity);

  if (totalSteps === 0) return null;

  const stackRef =
    mvpPlan.stack.length > 0
      ? `Stack de référence : ${mvpPlan.stack.join(" · ")}`
      : null;

  return (
    <details className="rounded-xl border border-border bg-card shadow-card">
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
              Plan
            </p>
            <p className="mt-0.5 font-medium">
              Voir le plan complet ({totalSteps} étapes)
            </p>
            {stackRef ? (
              <p className="mt-1 text-xs text-muted-foreground">{stackRef}</p>
            ) : null}
          </div>
          <span className="font-data text-sm tabular-nums text-primary">
            {progress.done}/{progress.total}
          </span>
        </div>
      </summary>

      <div className="border-t border-border px-5 pb-5 pt-4">
        <div className="relative">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-border" />
          <div className="space-y-3">
            {mvpPlan.roadmap.map((step, index) => (
              <CompactTimelineStep
                key={`${step.day}-${index}`}
                step={step}
                index={index}
                lastIndex={lastIndex}
                currentIndex={currentIndex}
                totalSteps={totalSteps}
                project={project}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}
