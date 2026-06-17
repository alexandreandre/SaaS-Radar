"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Sparkles,
  Target,
} from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getBuildGitHubAlert } from "@/lib/build/github-alerts";
import type { DevStream } from "@/lib/connectors/streams";
import {
  getBuildHeroView,
  getContextualPitfall,
} from "@/lib/build-recipe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuildTodayProps = {
  opportunity: Opportunity;
  project: UserProject;
  onToggleMilestone: (milestoneId: string) => void;
};

export function BuildToday({ opportunity, project, onToggleMilestone }: BuildTodayProps) {
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
  const keyFeatures = opportunity.mvpPlan.features.slice(0, 3);
  const contextualPitfall = getContextualPitfall(opportunity, hero.stepIndex);
  const githubStream = project.connectorStreams?.github as DevStream | undefined;
  const githubAlert = getBuildGitHubAlert(project, githubStream);

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

  const subtitle = hero.allDone
    ? "Roadmap terminée — passez au lancement"
    : `${hero.step.day}${hero.step.objective ? ` · ${hero.step.objective}` : ""}`;

  return (
    <section className="overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-card">
      <div className="mb-4">
        <p className="label-data text-primary">Build — votre étape du jour</p>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-medium tabular-nums">
            Étape {hero.progress.done}/{hero.progress.total}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="font-data font-semibold tabular-nums text-primary">
            {hero.progress.percent}%
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            J{hero.currentPlanDay}/{hero.planDuration}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            paceStyles[hero.pace.tone],
          )}
        >
          {hero.pace.label}
          {hero.pace.delta !== 0 ? (
            <span className="ml-1 font-data tabular-nums">
              ({hero.pace.delta > 0 ? `+${hero.pace.delta}` : hero.pace.delta})
            </span>
          ) : null}
        </span>
      </div>

      {githubAlert ? (
        <div
          className={cn(
            "mt-4 rounded-lg border px-3 py-2 text-sm",
            githubAlert.severity === "critical" && "border-destructive/40 bg-destructive/5",
            githubAlert.severity === "warning" && "border-amber-500/30 bg-amber-500/5",
            githubAlert.severity === "info" && "border-border bg-muted/30",
          )}
        >
          {githubAlert.message}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {hero.allDone ? "Roadmap terminée — passez au lancement" : hero.step.objective}
          </h2>
          {!hero.allDone && hero.step.estimateHours ? (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              ~{hero.step.estimateHours}h estimées
            </p>
          ) : null}
        </div>
      </div>

      {!hero.allDone ? (
        <ul className="mt-4 space-y-2">
          {hero.step.tasks.map((task, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
              {task}
            </li>
          ))}
        </ul>
      ) : null}

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

      {hero.stepIndex <= 1 && keyFeatures.length > 0 && !hero.allDone ? (
        <div className="mt-4 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Périmètre MVP — rappel
          </p>
          <ul className="mt-2 space-y-1">
            {keyFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {contextualPitfall && !hero.allDone ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-foreground/90">{contextualPitfall}</p>
        </div>
      ) : null}

      {!hero.allDone ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" className="gap-2" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copier le prompt et commencer
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
              Marquer comme fait
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 self-center text-sm text-emerald-600">
              <Check className="h-4 w-4" />
              Étape validée
            </span>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Objectif {hero.targetClients} clients ({project.targetScenario}) — consultez la checklist
          de lancement ci-dessous.
        </p>
      )}
    </section>
  );
}
