"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getCampaignOrchestratorState } from "@/lib/campaign/orchestrator";
import {
  GTM_ENGINE_LABELS,
  resolveGtmEngineFocus,
} from "@/lib/campaign/gtm-engine";
import { cn } from "@/lib/utils";

type CampaignHeaderProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  onBlockerClick?: (anchor: string) => void;
};

export function CampaignHeader({
  project,
  opportunity,
  stage,
  channel,
  onBlockerClick,
}: CampaignHeaderProps) {
  const state = getCampaignOrchestratorState(project, opportunity, stage, channel);
  const engine = resolveGtmEngineFocus(stage, project.campaignSetup);
  const { readiness, smartGoalProgress } = state;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {GTM_ENGINE_LABELS[engine]}
            </span>
            <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
              Semaine {state.currentWeek}/{state.totalWeeks}
            </p>
          </div>
          <p className="text-sm font-semibold">{state.weekObjective ?? state.focusLabel}</p>
          <p className="text-xs text-muted-foreground">
            Focus : {state.focusLabel}
            {state.supportChannels.length > 0
              ? ` · +${state.supportChannels.length} tâche(s) secondaire(s)`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-right text-xs">
          <div>
            <p className="text-muted-foreground">Readiness</p>
            <p
              className={cn(
                "font-semibold",
                readiness.score >= 60 ? "text-emerald-600" : "text-amber-600",
              )}
            >
              {readiness.score}%
            </p>
          </div>
          {smartGoalProgress ? (
            <div>
              <p className="text-muted-foreground">Objectif</p>
              <p className="font-semibold">
                {smartGoalProgress.current}/{smartGoalProgress.target}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {readiness.readyLabels.map((label) => (
          <span
            key={label}
            className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
          >
            {label} ✓
          </span>
        ))}
        {readiness.blockers.slice(0, 2).map((blocker) => (
          <button
            key={blocker}
            type="button"
            onClick={() => onBlockerClick?.("foundations-screen")}
            className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-800 hover:bg-amber-500/20 dark:text-amber-200"
          >
            {blocker}
          </button>
        ))}
      </div>
    </section>
  );
}
