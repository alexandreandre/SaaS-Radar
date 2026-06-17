"use client";

import { Check } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import {
  getBuildJourneyState,
  JOURNEY_STEPS,
  type BuildJourneyDisplayPhase,
  type BuildJourneyState,
} from "@/lib/build/journey";
import { cn } from "@/lib/utils";

type BuildJourneyStepperProps = {
  project: UserProject;
};

function JourneyProgressCompact({ journey }: { journey: BuildJourneyState }) {
  const allDone = journey.displayPhase === "live";
  const progressRatio = allDone
    ? 1
    : Math.max(0, (journey.currentStep - 1) / (JOURNEY_STEPS.length - 1));

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-[11px] h-px bg-border"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[16.67%] top-[11px] h-px bg-emerald-500/40 transition-[width]"
        style={{ width: `${progressRatio * 66.67}%` }}
        aria-hidden
      />
      <ol className="relative grid w-full grid-cols-3">
        {JOURNEY_STEPS.map(({ step, label }) => {
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

function JourneyCoachBlock({ journey }: { journey: BuildJourneyState }) {
  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <p className="text-xs text-muted-foreground">Étape {journey.currentStep}/3</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{journey.actionTitle}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        {journey.actionDetail}
      </p>
    </div>
  );
}

function JourneyBuildingHint({ journey }: { journey: BuildJourneyState }) {
  return (
    <p className="mt-2 text-xs text-muted-foreground">{journey.actionDetail}</p>
  );
}

function JourneyLiveStrip() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <Check className="h-3 w-3" aria-hidden />
      </span>
      <span>App suivie — concentrez-vous sur les prochaines itérations.</span>
    </div>
  );
}

function phaseShellClass(phase: BuildJourneyDisplayPhase): string {
  if (phase === "onboarding") {
    return "rounded-lg border border-border/70 bg-muted/10 px-3 py-3";
  }
  return "rounded-lg border border-border/60 bg-muted/5 px-3 py-2.5";
}

export function BuildJourneyStepper({ project }: BuildJourneyStepperProps) {
  const journey = getBuildJourneyState(project);

  if (journey.displayPhase === "live") {
    return (
      <section className={phaseShellClass("live")} aria-label="Parcours build">
        <JourneyLiveStrip />
      </section>
    );
  }

  return (
    <section className={phaseShellClass(journey.displayPhase)} aria-label="Parcours build">
      <JourneyProgressCompact journey={journey} />

      {journey.displayPhase === "onboarding" && journey.showCoachCopy ? (
        <JourneyCoachBlock journey={journey} />
      ) : null}

      {journey.displayPhase === "building" && journey.showCoachCopy ? (
        <JourneyBuildingHint journey={journey} />
      ) : null}
    </section>
  );
}
