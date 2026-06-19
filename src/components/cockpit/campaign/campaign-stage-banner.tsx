"use client";

import { ChevronDown } from "lucide-react";
import {
  ACQUISITION_STAGES,
  getStageDefinition,
  type AcquisitionStage,
} from "@/lib/campaign/stages";
import { cn } from "@/lib/utils";

type CampaignStageBannerProps = {
  stage: AcquisitionStage;
  primaryMetric: string;
  onStageSelect: (stage: AcquisitionStage) => void;
  suggestScale?: boolean;
};

export function CampaignStageBanner({
  stage,
  primaryMetric,
  onStageSelect,
  suggestScale,
}: CampaignStageBannerProps) {
  const def = getStageDefinition(stage);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="min-w-0 space-y-1">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">
          Stade d&apos;acquisition
        </p>
        <p className="text-sm font-medium">{def.label} · {def.customerRange}</p>
        <p className="text-xs text-muted-foreground">{def.description}</p>
        <p className="text-xs text-muted-foreground">
          Métrique clé : <span className="text-foreground">{primaryMetric}</span>
        </p>
        {suggestScale ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Vous avez de la traction — le stade Scale pub peut être pertinent.
          </p>
        ) : null}
      </div>

      <details className="group relative">
        <summary
          className={cn(
            "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-border",
            "bg-card px-3 py-1.5 text-sm marker:content-none [&::-webkit-details-marker]:hidden",
            "hover:border-primary/40",
          )}
        >
          <span className="font-medium">Changer</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute right-0 z-10 mt-2 min-w-[260px] rounded-xl border border-border bg-card p-2 shadow-lg">
          {ACQUISITION_STAGES.map((s) => {
            const item = getStageDefinition(s);
            const isActive = s === stage;
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
                <span className="font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.customerRange} — {item.primaryMetric}
                </span>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
