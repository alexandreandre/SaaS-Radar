"use client";

import { useState } from "react";
import { Ban, Check, ChevronRight, Clock, Copy, Layers, Target } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  getBuildStepMilestoneId,
  getCurrentBuildStepIndex,
  getStepPrompt,
  getWeekForRoadmapStep,
} from "@/lib/build-recipe";
import { Checkbox } from "@/components/ui/checkbox";
import { CelebrationOverlay } from "@/components/cockpit/celebration-overlay";
import { getOnboardingProgress } from "@/lib/build-launch";
import { cn } from "@/lib/utils";

type BuildRoadmapProps = {
  opportunity: Opportunity;
  project: UserProject;
  onToggle: (milestoneId: string) => void;
};

function CopyPromptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-500" />
          Copié
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copier prompt
        </>
      )}
    </button>
  );
}

export function BuildRoadmap({ opportunity, project, onToggle }: BuildRoadmapProps) {
  const { mvpPlan } = opportunity;
  const currentIndex = getCurrentBuildStepIndex(project, opportunity);
  const [celebration, setCelebration] = useState<string | null>(null);
  const totalSteps = mvpPlan.roadmap.length;

  const handleToggle = (milestoneId: string) => {
    const milestone = project.milestones.find((m) => m.id === milestoneId);
    const markingDone = milestone && !milestone.done;
    onToggle(milestoneId);

    if (markingDone) {
      const progress = getOnboardingProgress({
        ...project,
        milestones: project.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: true } : m,
        ),
      });
      if (progress.done >= progress.target) {
        setCelebration("Cockpit complet débloqué — excellent rythme !");
      } else if (progress.done === 1) {
        setCelebration("Première étape validée — continuez !");
      } else {
        setCelebration(`Étape ${progress.done}/${progress.target} — vous avancez bien`);
      }
    }
  };

  return (
    <>
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-primary">Roadmap</p>
            <h3 className="mt-1 text-lg font-semibold">Plan jour par jour</h3>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute bottom-0 left-5 top-0 w-px bg-border" />
          <div className="space-y-4">
            {mvpPlan.roadmap.map((step, index) => {
              const milestoneId = getBuildStepMilestoneId(index);
              const milestone = project.milestones.find((m) => m.id === milestoneId);
              const isDone = milestone?.done ?? false;
              const isCurrent = index === currentIndex && !isDone;
              const isFuture = index > currentIndex && !isDone;
              const week = getWeekForRoadmapStep(step, index, totalSteps);
              const prompt = getStepPrompt(step, opportunity);

              return (
                <div key={`${step.day}-${index}`} className="relative pl-12">
                  <div
                    className={cn(
                      "absolute left-3.5 top-5 h-3 w-3 shrink-0 rounded-full border-2 ring-4 ring-background",
                      isDone && "border-emerald-500 bg-emerald-500",
                      isCurrent && "border-primary bg-primary",
                      isFuture && "border-border bg-muted",
                    )}
                  />
                  <details
                    className={cn(
                      "group rounded-xl border bg-card transition-colors",
                      isCurrent && "border-primary/40 ring-1 ring-primary/20",
                      isFuture && "opacity-75",
                      !isCurrent && "border-border",
                    )}
                    open={isCurrent}
                  >
                    <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          {step.day}
                        </span>
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
                        {isDone ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
                            Fait
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={cn(
                          "mt-1 font-medium",
                          isDone && "text-muted-foreground line-through",
                        )}
                      >
                        {step.objective ?? step.tasks[0]}
                      </p>
                    </summary>

                    <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
                      {step.checkpoint ? (
                        <div className="flex items-start gap-2 rounded-lg bg-muted/30 p-3 text-sm">
                          <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Critère de fin
                            </p>
                            <p className="mt-0.5">{step.checkpoint}</p>
                          </div>
                        </div>
                      ) : null}

                      <ul className="space-y-2">
                        {step.tasks.map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            {task}
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap items-center gap-3">
                        <CopyPromptButton text={prompt} />
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={isDone}
                            onCheckedChange={() => handleToggle(milestoneId)}
                          />
                          Étape terminée
                        </label>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </div>

        <details className="group mb-4 rounded-xl border border-border bg-muted/20">
          <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Périmètre MVP
            </span>
          </summary>
          <div className="space-y-4 border-t border-border px-5 pb-5 pt-2">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Ce que tu construis
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {mvpPlan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Ban className="h-3.5 w-3.5" />
                Pas au J1
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {mvpPlan.notYet.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ban className="h-3.5 w-3.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

        <RevenueMilestones project={project} onToggle={onToggle} />
      </section>

      <CelebrationOverlay
        show={celebration !== null}
        message={celebration ?? ""}
        variant={celebration?.includes("débloqué") ? "complete" : "milestone"}
        onDone={() => setCelebration(null)}
      />
    </>
  );
}

function RevenueMilestones({
  project,
  onToggle,
}: {
  project: UserProject;
  onToggle: (id: string) => void;
}) {
  const revenueMilestones = project.milestones.filter((m) => m.source === "revenue");
  if (revenueMilestones.length === 0) return null;

  return (
    <div>
      <h4 className="font-semibold">Jalons revenus</h4>
      <div className="mt-3 space-y-2">
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
  );
}
