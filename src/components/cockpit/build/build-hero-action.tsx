"use client";

import { useState } from "react";
import { Check, Clock, Copy, Sparkles, Target } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getBuildHeroView } from "@/lib/build-recipe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuildHeroActionProps = {
  opportunity: Opportunity;
  project: UserProject;
  onToggleMilestone: (milestoneId: string) => void;
};

export function BuildHeroAction({
  opportunity,
  project,
  onToggleMilestone,
}: BuildHeroActionProps) {
  const hero = getBuildHeroView(project, opportunity);
  const [copied, setCopied] = useState(false);

  if (!hero) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <p className="text-sm text-muted-foreground">
          Aucune roadmap disponible pour cette opportunité.
        </p>
      </section>
    );
  }

  const milestoneId = `build-step-${hero.stepIndex}`;
  const milestone = project.milestones.find((m) => m.id === milestoneId);
  const isDone = milestone?.done ?? false;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hero.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paceStyles = {
    ahead: "text-emerald-600 bg-emerald-500/10",
    behind: "text-amber-600 bg-amber-500/10",
    on_track: "text-muted-foreground bg-muted",
  };

  return (
    <section className="overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-data text-[10px] uppercase tracking-data text-primary">
            Action du jour · J{hero.currentPlanDay}/{hero.planDuration}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {hero.allDone ? "Roadmap terminée — passez au lancement" : hero.step.objective}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hero.step.day}
            {hero.step.estimateHours ? (
              <span className="ml-2 inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                ~{hero.step.estimateHours}h
              </span>
            ) : null}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            paceStyles[hero.pace.tone],
          )}
        >
          {hero.pace.label}
        </span>
      </div>

      {!hero.allDone && hero.step.checkpoint ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Critère de fin
            </p>
            <p className="mt-0.5 text-foreground/90">{hero.step.checkpoint}</p>
          </div>
        </div>
      ) : null}

      {!hero.allDone ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" className="gap-2" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copier le prompt de l&apos;étape
              </>
            )}
          </Button>
          {!isDone ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => onToggleMilestone(milestoneId)}
            >
              <Sparkles className="h-4 w-4" />
              Marquer l&apos;étape comme faite
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 self-center text-sm text-emerald-600">
              <Check className="h-4 w-4" />
              Étape validée
            </span>
          )}
        </div>
      ) : null}

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${hero.progress.percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {hero.progress.done}/{hero.progress.total} étapes · objectif {hero.targetClients} clients (
        {project.targetScenario})
      </p>
    </section>
  );
}
