"use client";

import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import {
  CAMPAIGN_PHASES,
  type CampaignPhaseId,
  isPhaseUnlocked,
} from "@/lib/campaign/phases";
import { cn } from "@/lib/utils";

type CampaignPhaseStepperProps = {
  project: UserProject;
  stage: AcquisitionStage;
  activePhase: CampaignPhaseId;
  onPhaseSelect: (phase: CampaignPhaseId) => void;
};

export function CampaignPhaseStepper({
  project,
  stage,
  activePhase,
  onPhaseSelect,
}: CampaignPhaseStepperProps) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {CAMPAIGN_PHASES.map((phase) => {
        const unlocked = isPhaseUnlocked(project, phase.id, stage);
        return (
          <button
            key={phase.id}
            type="button"
            disabled={!unlocked}
            onClick={() => unlocked && onPhaseSelect(phase.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm transition-colors",
              activePhase === phase.id
                ? "bg-primary text-primary-foreground"
                : unlocked
                  ? "bg-muted/50 hover:bg-muted"
                  : "cursor-not-allowed opacity-40",
            )}
          >
            {phase.step}. {phase.label}
          </button>
        );
      })}
    </nav>
  );
}
