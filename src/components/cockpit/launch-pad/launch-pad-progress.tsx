"use client";

import type { UserProject } from "@/lib/portfolio";
import { getOnboardingProgress } from "@/lib/build-launch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LaunchPadProgressProps = {
  project: UserProject;
  currentWeek: number;
  weekGoal: string;
  onCompleteEarly?: () => void;
};

export function LaunchPadProgress({
  project,
  currentWeek,
  weekGoal,
  onCompleteEarly,
}: LaunchPadProgressProps) {
  const { done, target } = getOnboardingProgress(project);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-data text-[10px] uppercase tracking-data text-primary">
            Semaine {currentWeek} · {weekGoal}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: target }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i < done ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {done}/{target} actions
            </span>
          </div>
        </div>
        {onCompleteEarly ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCompleteEarly}>
            Cockpit complet
          </Button>
        ) : null}
      </div>
    </div>
  );
}
