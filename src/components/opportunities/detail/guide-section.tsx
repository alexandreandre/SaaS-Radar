"use client";

import { Ban, Check, ChevronRight, Hammer, Layers, Sparkles } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { cn } from "@/lib/utils";
import { getMilestoneProgress } from "@/lib/portfolio";
import {
  getCurrentPlanDay,
  getCurrentRoadmapStepIndex,
  getGuideMilestoneProgress,
  getPlanDayRangeLabel,
  getPlanDurationDays,
  getStepWeek,
  getTargetClients,
} from "@/lib/guide-plan";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";
import { BuildOpportunityCta } from "@/components/cockpit/build-opportunity-cta";
import { StackInline } from "@/components/cockpit/build/build-tool-logo";
import { PlaybookGuideContextBanner } from "@/components/cockpit/playbook/playbook-guide-context";
import { Button } from "@/components/ui/button";

export type GuideContext = "detail" | "playbook" | "drawer" | "cockpit";

interface GuideSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
  variant?: "detail" | "playbook";
  context?: GuideContext;
  project?: UserProject;
  onModuleChange?: (module: CockpitModuleId) => void;
  onOpenPrompt?: () => void;
}

function GuideWrapper({
  isPlaybook,
  animationIndex,
  className,
  children,
  id,
}: {
  isPlaybook: boolean;
  animationIndex: number;
  className?: string;
  children: React.ReactNode;
  id: string;
}) {
  if (isPlaybook) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }
  return (
    <AnimatedSection id={id} animationIndex={animationIndex} className={className}>
      {children}
    </AnimatedSection>
  );
}

function GuideCockpitFooter({
  project,
  onModuleChange,
  onOpenPrompt,
}: {
  project: UserProject;
  onModuleChange?: (module: CockpitModuleId) => void;
  onOpenPrompt?: () => void;
}) {
  const journalProgress = getMilestoneProgress(project);
  const milestoneProgress = getGuideMilestoneProgress(project);

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-card p-6 text-center">
      <p className="font-semibold text-foreground">Passez à l&apos;action</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {milestoneProgress.total > 0
          ? `${milestoneProgress.done}/${milestoneProgress.total} jalons complétés · ${journalProgress} % du journal`
          : `${journalProgress} % du journal complété`}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {onModuleChange ? (
          <Button type="button" className="gap-2" onClick={() => onModuleChange("build")}>
            <Hammer className="h-4 w-4" />
            Ouvrir le journal Build
          </Button>
        ) : null}
        {onOpenPrompt ? (
          <Button type="button" variant="outline" className="gap-2" onClick={onOpenPrompt}>
            <Sparkles className="h-4 w-4" />
            Prompt MVP
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function GuideTimelineStep({
  step,
  index,
  lastIndex,
  currentStepIndex,
  totalSteps,
}: {
  step: Opportunity["mvpPlan"]["roadmap"][number];
  index: number;
  lastIndex: number;
  currentStepIndex: number;
  totalSteps: number;
}) {
  const focusMode = currentStepIndex >= 0;
  const isPast = focusMode && index < currentStepIndex;
  const isCurrent = focusMode && index === currentStepIndex;
  const isFuture = focusMode && index > currentStepIndex;
  const week = getStepWeek(step, index, totalSteps);

  const card = (
    <div
      className={cn(
        "flex-1 rounded-xl border border-border bg-card p-4 transition-colors",
        isCurrent && "border-primary/40 ring-1 ring-primary/20",
        isFuture && "opacity-60",
        !isFuture && "hover:border-border",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{step.day}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-data text-[10px] uppercase tracking-data text-muted-foreground">
            S{week}
          </span>
        </div>
        {index === 0 ? (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
            Démarrage
          </span>
        ) : null}
        {index === lastIndex ? (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-blue-400">
            Lancement
          </span>
        ) : null}
        {isCurrent ? (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            En cours
          </span>
        ) : null}
      </div>
      <ul className="space-y-1">
        {step.tasks.map((task, j) => (
          <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            {task}
          </li>
        ))}
      </ul>
    </div>
  );

  if (isPast) {
    return (
      <div className="relative pl-12">
        <div className="absolute left-3.5 top-4 h-3 w-3 shrink-0 rounded-full border-2 border-green-500 bg-green-500/80" />
        <details className="group">
          <summary className="cursor-pointer list-none rounded-xl border border-border/60 bg-muted/20 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {step.day}
                <span className="ml-2 text-xs text-muted-foreground/70">· S{week} · terminé</span>
              </span>
              <span className="text-xs text-muted-foreground/60">Afficher</span>
            </div>
          </summary>
          <div className="mt-2">{card}</div>
        </details>
      </div>
    );
  }

  return (
    <div className="relative flex gap-4 pl-12">
      <div
        className={cn(
          "absolute left-3.5 top-4 h-3 w-3 shrink-0 rounded-full border-2",
          index === 0
            ? "border-green-500 bg-green-500"
            : index === lastIndex
              ? "border-blue-500 bg-blue-500"
              : isCurrent
                ? "border-primary bg-primary"
                : "border-border bg-muted",
        )}
      />
      {card}
    </div>
  );
}

export function GuideSection({
  opportunity,
  animationIndex,
  variant = "detail",
  context = "detail",
  project,
  onModuleChange,
  onOpenPrompt,
}: GuideSectionProps) {
  const isPlaybook = variant === "playbook";
  const isCockpit = context === "cockpit" && Boolean(project);
  const { mvpPlan } = opportunity;
  const lastIndex = mvpPlan.roadmap.length - 1;
  const planLabel = getPlanDayRangeLabel(mvpPlan.roadmap);
  const planDays = getPlanDurationDays(mvpPlan.roadmap);
  const targetClients = getTargetClients(
    opportunity,
    project?.targetScenario ?? "Réaliste",
  );
  const currentPlanDay = project ? getCurrentPlanDay(project, opportunity) : null;
  const currentStepIndex =
    project && isCockpit ? getCurrentRoadmapStepIndex(project, opportunity) : 0;

  return (
    <GuideWrapper
      isPlaybook={isPlaybook}
      animationIndex={animationIndex}
      id="guide"
      className={cn(isPlaybook ? "mb-0" : "mb-12 scroll-mt-24")}
    >
      <SectionTitle
        number={isPlaybook ? 1 : 9}
        title={`Guide ${planLabel}`}
        subtitle={
          isPlaybook
            ? "Quoi faire chaque jour — de l'idée au premier client payant"
            : undefined
        }
        variant={isPlaybook ? "playbook" : "detail"}
      />
      {!isPlaybook ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Exactement quoi faire chaque jour — de l&apos;idée au premier client payant
        </p>
      ) : null}

      {isCockpit ? <PlaybookGuideContextBanner onModuleChange={onModuleChange} /> : null}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-black text-foreground">{planDays}</p>
          <p className="mt-1 text-xs text-muted-foreground">jours plan</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          {currentPlanDay !== null ? (
            <>
              <p className="text-2xl font-black text-primary">J{currentPlanDay}</p>
              <p className="mt-1 text-xs text-muted-foreground">jour actuel</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-green-400">{mvpPlan.features.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">features MVP</p>
            </>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-black text-blue-400">{targetClients}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {currentPlanDay !== null
              ? `clients (${project?.targetScenario ?? "Réaliste"})`
              : "clients cible"}
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute bottom-0 left-5 top-0 w-px bg-muted" />
        <div className="space-y-4">
          {mvpPlan.roadmap.map((step, i) => (
            <GuideTimelineStep
              key={`${step.day}-${i}`}
              step={step}
              index={i}
              lastIndex={lastIndex}
              currentStepIndex={isCockpit ? currentStepIndex : -1}
              totalSteps={mvpPlan.roadmap.length}
            />
          ))}
        </div>
      </div>

      <details open className="group mb-4 rounded-xl border border-border bg-card">
        <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            Périmètre MVP
          </span>
        </summary>
        <div className="space-y-4 border-t border-border px-5 pb-5 pt-2">
          {mvpPlan.stack.length > 0 ? (
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Stack MVP
              </div>
              <p className="mt-1.5 text-sm">
                <StackInline items={mvpPlan.stack} />
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-green-400" />
              Ce que tu construis
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {mvpPlan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Ban className="h-3.5 w-3.5" />
              Ce qu&apos;on ne construit PAS au J1
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {mvpPlan.notYet.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ban className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      {isCockpit && project ? (
        <GuideCockpitFooter
          project={project}
          onModuleChange={onModuleChange}
          onOpenPrompt={onOpenPrompt}
        />
      ) : (
        <BuildOpportunityCta opportunity={opportunity} variant="footer" />
      )}
    </GuideWrapper>
  );
}
