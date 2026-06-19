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
        className="pointer-events-none absolute left-[10%] right-[10%] top-[11px] h-px bg-border"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[10%] top-[11px] h-px bg-emerald-500/40 transition-[width]"
        style={{ width: `${progressRatio * 80}%` }}
        aria-hidden
      />
      <ol className="relative grid w-full grid-cols-5 gap-0">
        {CAMPAIGN_JOURNEY_STEPS.map(({ step, label }) => {
          const done = allDone || step < journey.currentStep;
          const active = !allDone && step === journey.currentStep;

          return (
            <li key={step} className="flex min-w-0 flex-col items-center gap-1 px-0.5">
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
                  "w-full truncate text-center text-[9px] font-medium sm:text-[10px]",
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
      <p className="text-xs text-muted-foreground">
        Étape {journey.currentStep}/{CAMPAIGN_JOURNEY_STEPS.length}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{journey.actionTitle}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        {journey.actionDetail}
      </p>
      {journey.secondaryDetail ? (
        <p className="mt-1 text-xs text-muted-foreground">{journey.secondaryDetail}</p>
      ) : null}
    </div>
  );
}

function JourneyIteratingStrip() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <Check className="h-3 w-3" aria-hidden />
      </span>
      <span>Cycle clôturé — lancez le prochain ou consultez Acquisition.</span>
    </div>
  );
}

function phaseShellClass(phase: CampaignDisplayPhase): string {
  if (phase === "strategy" || phase === "preparing") {
    return "rounded-lg border border-border/70 bg-muted/10 px-3 py-3";
  }
  return "rounded-lg border border-border/60 bg-muted/5 px-3 py-2.5";
}

export function CampaignJourneyStepper({
  project,
  opportunity,
}: CampaignJourneyStepperProps) {
  const journey = getCampaignJourneyState(project, opportunity);

  if (journey.displayPhase === "iterating") {
    return (
      <section className={phaseShellClass("iterating")} aria-label="Parcours campagne">
        <JourneyIteratingStrip />
      </section>
    );
  }

  return (
    <section className={phaseShellClass(journey.displayPhase)} aria-label="Parcours campagne">
      <JourneyProgressCompact journey={journey} />
      {journey.showCoachCopy ? <JourneyCoachBlock journey={journey} /> : null}
    </section>
  );
}
