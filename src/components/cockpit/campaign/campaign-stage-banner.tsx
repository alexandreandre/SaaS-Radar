"use client";

import { ChevronDown, Sparkles, UserPen } from "lucide-react";
import {
  ACQUISITION_STAGES,
  getStageDefinition,
  type AcquisitionStage,
} from "@/lib/campaign/stages";
import type { StageGuidance } from "@/lib/campaign/stage-guidance";
import { cn } from "@/lib/utils";

type CampaignStageBannerProps = {
  guidance: StageGuidance;
  onStageSelect: (stage: AcquisitionStage) => void;
  onResetToRecommended?: () => void;
  suggestScale?: boolean;
};

export function CampaignStageBanner({
  guidance,
  onStageSelect,
  onResetToRecommended,
  suggestScale,
}: CampaignStageBannerProps) {
  const {
    stage,
    recommendedStage,
    isManualOverride,
    headline,
    reason,
    focusLine,
    typicalClients,
    primaryMetric,
  } = guidance;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-data text-[10px] uppercase tracking-data text-primary">
              {isManualOverride ? "Stade choisi" : "Stade recommandé pour vous"}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                isManualOverride
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/15 text-primary",
              )}
            >
              {isManualOverride ? (
                <>
                  <UserPen className="h-3 w-3" />
                  Ajusté
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Auto
                </>
              )}
            </span>
          </div>

          <p className="text-base font-semibold">{headline}</p>
          <p className="text-sm text-foreground/90">{reason}</p>
          <p className="text-xs text-muted-foreground">{focusLine}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
            <span>
              Référence typique :{" "}
              <span className="text-foreground">{typicalClients}</span>
            </span>
            <span>
              Métrique clé :{" "}
              <span className="text-foreground">{primaryMetric}</span>
            </span>
          </div>

          {suggestScale ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Vous avez de la traction — le stade Scale pub peut être pertinent.
            </p>
          ) : null}

          {isManualOverride && recommendedStage !== stage && onResetToRecommended ? (
            <button
              type="button"
              onClick={onResetToRecommended}
              className="text-xs font-medium text-primary underline underline-offset-2 hover:no-underline"
            >
              Revenir à « {getStageDefinition(recommendedStage).label} » (recommandé)
            </button>
          ) : null}
        </div>

        <details className="group relative shrink-0">
          <summary
            className={cn(
              "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-border",
              "bg-card px-3 py-1.5 text-sm marker:content-none [&::-webkit-details-marker]:hidden",
              "hover:border-primary/40",
            )}
          >
            <span className="font-medium">Ajuster le stade</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 z-10 mt-2 min-w-[280px] rounded-xl border border-border bg-card p-2 shadow-lg">
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              Déjà des clients ou une stratégie différente ? Choisissez le stade qui
              correspond à votre situation réelle.
            </p>
            {ACQUISITION_STAGES.map((s) => {
              const item = getStageDefinition(s);
              const isActive = s === stage;
              const isRecommended = s === recommendedStage;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStageSelect(s)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isActive ? "bg-primary/10 text-foreground" : "hover:bg-muted/50",
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {item.label}
                    {isRecommended ? (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        Recommandé
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.customerRange} — {item.primaryMetric}
                  </span>
                </button>
              );
            })}
          </div>
        </details>
      </div>
    </div>
  );
}
