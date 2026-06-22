"use client";

import { Check } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import {
  CAMPAIGN_PHASES,
  canAdvanceToPhase,
  getCompletedPhaseCount,
  getPhaseCompletionStatus,
  type CampaignPhaseId,
} from "@/lib/campaign/phases";
import { cn } from "@/lib/utils";

type CampaignPhaseStepperProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  activePhase: CampaignPhaseId;
  onPhaseSelect: (phase: CampaignPhaseId) => void;
};

export function CampaignPhaseStepper({
  project,
  opportunity,
  stage,
  activePhase,
  onPhaseSelect,
}: CampaignPhaseStepperProps) {
  const completedCount = getCompletedPhaseCount(project, opportunity);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Progression : {completedCount}/{CAMPAIGN_PHASES.length} phases
        </span>
        <div className="h-1.5 min-w-[120px] flex-1 max-w-[200px] overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completedCount / CAMPAIGN_PHASES.length) * 100}%` }}
          />
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
        {CAMPAIGN_PHASES.map((phase) => {
          const status = getPhaseCompletionStatus(project, phase.id, stage, opportunity);
          const unlocked = status !== "locked";
          const advance = canAdvanceToPhase(project, phase.id, stage, opportunity);
          const isComplete = status === "complete";

          return (
            <div key={phase.id} className="flex min-w-[140px] flex-1 flex-col gap-1">
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && onPhaseSelect(phase.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors",
                  activePhase === phase.id
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                      : unlocked
                        ? "bg-muted/50 hover:bg-muted"
                        : "cursor-not-allowed opacity-40",
                )}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <span className="font-data text-[10px] opacity-80">{phase.step}</span>
                )}
                <span>{phase.label}</span>
              </button>
              {status === "locked" && advance.reason ? (
                <p className="px-1 text-[10px] leading-tight text-muted-foreground">
                  Verrouillé : {advance.reason}
                </p>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
