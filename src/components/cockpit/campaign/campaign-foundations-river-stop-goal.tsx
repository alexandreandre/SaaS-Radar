"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import {
  resolveGoalFromStrategy,
  truncateAtSentence,
  type FoundationsRiverGoalDraft,
  type RiverGoalStrategyId,
} from "@/lib/campaign/foundations-river";
import { CampaignRiverStopShell } from "@/components/cockpit/campaign/campaign-river-stop-shell";
import { cn } from "@/lib/utils";

type CampaignFoundationsRiverStopGoalProps = {
  draft: FoundationsRiverGoalDraft;
  audienceWho: string;
  productName: string;
  stage: AcquisitionStage;
  clientsFromScenario?: number;
  onConfirm: (payload: {
    strategyId: RiverGoalStrategyId;
    draft: FoundationsRiverGoalDraft;
  }) => void;
  onBack: () => void;
  onOpenAdvanced?: () => void;
};

export function CampaignFoundationsRiverStopGoal({
  draft,
  audienceWho,
  productName,
  stage,
  clientsFromScenario,
  onConfirm,
  onBack,
  onOpenAdvanced,
}: CampaignFoundationsRiverStopGoalProps) {
  const [selectedId, setSelectedId] = useState(draft.selectedStrategyId);

  const audienceShort = truncateAtSentence(audienceWho, 70);

  const resolved = useMemo(() => {
    const strategy = draft.strategies.find((s) => s.id === selectedId) ?? draft.strategies[0]!;
    return resolveGoalFromStrategy(strategy, stage, clientsFromScenario);
  }, [draft.strategies, selectedId, stage, clientsFromScenario]);

  function handleConfirm() {
    const strategy = draft.strategies.find((s) => s.id === selectedId)!;
    const fullDraft: FoundationsRiverGoalDraft = {
      strategies: draft.strategies,
      selectedStrategyId: selectedId,
      ...resolveGoalFromStrategy(strategy, stage, clientsFromScenario),
    };
    onConfirm({ strategyId: selectedId, draft: fullDraft });
  }

  return (
    <CampaignRiverStopShell
      title="On vise ça"
      subtitle={`Comment voulez-vous toucher ${audienceShort} ?`}
      actionHint="Choisissez l'approche qui vous ressemble — on calcule le reste pour vous."
      onConfirm={handleConfirm}
      onBack={onBack}
    >
      <div className="space-y-3">
        {draft.strategies.map((strategy) => {
          const selected = strategy.id === selectedId;
          return (
            <button
              key={strategy.id}
              type="button"
              onClick={() => setSelectedId(strategy.id)}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                  )}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{strategy.title}</p>
                    {strategy.recommended ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Suggéré
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{strategy.subtitle}</p>
                  <p className="text-xs text-muted-foreground/90">{strategy.hint}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {resolved.recapLabel ? (
        <p className="mt-4 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          En résumé : <span className="font-medium text-foreground">{resolved.recapLabel}</span>
          {" · "}
          on fixe les chiffres exacts à l&apos;étape Mesure.
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        Suggestion basée sur votre fiche Idée · {productName}
      </p>

      {onOpenAdvanced ? (
        <button
          type="button"
          className="mt-4 text-xs font-medium text-primary underline underline-offset-2"
          onClick={onOpenAdvanced}
        >
          Affiner la stratégie avancée
        </button>
      ) : null}
    </CampaignRiverStopShell>
  );
}
