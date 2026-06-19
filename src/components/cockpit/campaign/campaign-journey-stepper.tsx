"use client";

import { Check } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  CAMPAIGN_JOURNEY_STEPS,
  getCampaignJourneyState,
  type CampaignDisplayPhase,
  type CampaignJourneyState,
} from "@/lib/campaign/journey";
import { cn } from "@/lib/utils";

type CampaignJourneyStepperProps = {
  project: UserProject;
  opportunity?: Opportunity;
};

function JourneyProgressCompact({ journey }: { journey: CampaignJourneyState }) {
  const allDone = journey.displayPhase === "iterating";
  const progressRatio = allDone
    ? 1
    : Math.max(0, (journey.currentStep - 1) / (CAMPAIGN_JOURNEY_STEPS.length - 1));

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[11px] h-px bg-border"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[12.5%] top-[11px] h-px bg-emerald-500/40 transition-[width]"
        style={{ width: `${progressRatio * 75}%` }}
        aria-hidden
      />
      <ol className="relative grid w-full grid-cols-4">
        {CAMPAIGN_JOURNEY_STEPS.map(({ step, label }) => {
          const done = allDone || step < journey.currentStep;
          const active = !allDone && step === journey.currentStep;

          return (
            <li key={step} className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  done && "bg-emerald-500 text-white",
                  active && !done && "bg-primary text-primary-foreground",
                  !done && !active && "border border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : step}
              </span>
              <span
                className={cn(
                  "w-full truncate text-center text-[10px] font-medium sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function JourneyCoachBlock({ journey }: { journey: CampaignJourneyState }) {
  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <p className="text-xs text-muted-foreground">Étape {journey.currentStep}/4</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{journey.actionTitle}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        {journey.actionDetail}
      </p>
      {journey.appOnlineWarning ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {journey.appOnlineWarning}
        </p>
      ) : null}
      {journey.secondaryDetail ? (
        <p className="mt-1 text-xs text-muted-foreground">{journey.secondaryDetail}</p>
      ) : null}
    </div>
  );
}

function phaseShellClass(phase: CampaignDisplayPhase): string {
  if (phase === "strategy" || phase === "creating") {
    return "rounded-lg border border-border/70 bg-muted/10 px-3 py-3";
  }
  return "rounded-lg border border-border/60 bg-muted/5 px-3 py-2.5";
}

export function CampaignJourneyStepper({
  project,
  opportunity,
}: CampaignJourneyStepperProps) {
  const journey = getCampaignJourneyState(project, opportunity);
  const showCoach =
    journey.showCoachCopy ||
    journey.displayPhase === "strategy" ||
    journey.displayPhase === "creating";

  return (
    <section
      aria-label="Parcours campagne"
      className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5"
    >
      <p className="font-data text-[10px] uppercase tracking-data text-primary">
        Ma campagne
      </p>
      <div className={cn("mt-3", phaseShellClass(journey.displayPhase))}>
        <JourneyProgressCompact journey={journey} />
        {showCoach ? <JourneyCoachBlock journey={journey} /> : null}
      </div>
    </section>
  );
}
