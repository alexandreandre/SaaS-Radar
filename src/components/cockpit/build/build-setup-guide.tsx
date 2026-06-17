"use client";

import {
  ClipboardPaste,
  Database,
  KeyRound,
  MessageSquarePlus,
  PlayCircle,
  Rocket,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { SetupGuideStep } from "@/lib/build/setup-guide";
import type { SetupStepKind } from "@/lib/build/kit-content";
import { matchInfraBrand } from "@/lib/build/brands";
import { KitRichText } from "@/components/cockpit/build/kit-rich-text";
import { BuildInfraLogo } from "@/components/cockpit/build/build-tool-logo";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<SetupStepKind, LucideIcon> = {
  plan_mode: Sparkles,
  infra: Database,
  paste_prompt: ClipboardPaste,
  env: KeyRound,
  test: PlayCircle,
  iterate: MessageSquarePlus,
  generic: Rocket,
};

function SetupGuideStepRow({
  step,
  index,
}: {
  step: SetupGuideStep;
  index: number;
}) {
  const infraBrand =
    step.kind === "infra" ? matchInfraBrand(`${step.title} ${step.body}`) : null;
  const Icon = STEP_ICONS[step.kind];

  return (
    <li className="flex gap-3 rounded-lg border border-border/60 bg-muted/15 px-3 py-3.5 sm:px-4">
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground ring-1 ring-border/70">
          {index + 1}
        </span>
        {infraBrand ? (
          <BuildInfraLogo brandId={infraBrand} size="xs" variant="inline" />
        ) : (
          <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold leading-snug text-foreground">{step.title}</p>
          {step.recommended ? (
            <span className="rounded-full bg-violet-500/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
              Recommandé
            </span>
          ) : null}
        </div>
        <KitRichText
          text={step.body}
          className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
        />
      </div>
    </li>
  );
}

type BuildSetupGuideProps = {
  steps: SetupGuideStep[];
  className?: string;
};

export function BuildSetupGuide({ steps, className }: BuildSetupGuideProps) {
  if (steps.length === 0) return null;

  return (
    <ol className={cn("space-y-2", className)}>
      {steps.map((step, index) => (
        <SetupGuideStepRow key={`${step.kind}-${index}`} step={step} index={index} />
      ))}
    </ol>
  );
}
