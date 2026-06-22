"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import {
  clampMessage,
  deriveMessageAdaptations,
  type FoundationsRiverMessageDraft,
  type MessageVariantId,
  type RiverMessageAdaptation,
} from "@/lib/campaign/foundations-river";
import { CampaignRiverStopShell } from "@/components/cockpit/campaign/campaign-river-stop-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MESSAGE_IDEAL_LENGTH = 120;

type CampaignFoundationsRiverStopMessageProps = {
  draft: FoundationsRiverMessageDraft;
  productName: string;
  audienceWho: string;
  audiencePain: string;
  goalRecapLabel?: string;
  primaryChannel: ExtendedChannelKey;
  supportChannels: ExtendedChannelKey[];
  onConfirm: (payload: {
    positioning: string;
    messageAdaptations: RiverMessageAdaptation[];
  }) => void;
  onBack: () => void;
};

function AdaptationPreview({ adaptations }: { adaptations: RiverMessageAdaptation[] }) {
  if (adaptations.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-border/80 bg-muted/20 p-4">
      <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
        Comment ça sonnera
      </p>
      <dl className="mt-3 space-y-2.5">
        {adaptations.map((item) => (
          <div key={`${item.channel}-${item.label}`}>
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-0.5 text-sm text-foreground">{item.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function CampaignFoundationsRiverStopMessage({
  draft,
  productName,
  audienceWho,
  audiencePain,
  goalRecapLabel,
  primaryChannel,
  supportChannels,
  onConfirm,
  onBack,
}: CampaignFoundationsRiverStopMessageProps) {
  const copyContext = useMemo(
    () => ({ productName, who: audienceWho, pain: audiencePain }),
    [productName, audienceWho, audiencePain],
  );

  const [selectedId, setSelectedId] = useState<MessageVariantId>(draft.selectedVariantId);
  const [adjusting, setAdjusting] = useState(false);
  const [customText, setCustomText] = useState(draft.positioning);

  const selectedVariant = useMemo(
    () => draft.variants.find((v) => v.id === selectedId) ?? draft.variants[0]!,
    [draft.variants, selectedId],
  );

  const coreText = adjusting ? customText : selectedVariant.text;

  const adaptations = useMemo(
    () =>
      deriveMessageAdaptations(coreText.trim(), primaryChannel, supportChannels, copyContext),
    [coreText, primaryChannel, supportChannels, copyContext],
  );

  function handleSelectVariant(id: MessageVariantId) {
    setSelectedId(id);
    const variant = draft.variants.find((v) => v.id === id);
    if (variant) setCustomText(variant.text);
  }

  function handleCycleVariant() {
    const idx = draft.variants.findIndex((v) => v.id === selectedId);
    const next = draft.variants[(idx + 1) % draft.variants.length]!;
    handleSelectVariant(next.id);
  }

  function handleConfirm() {
    const positioning = clampMessage(adjusting ? customText : selectedVariant.text);
    onConfirm({
      positioning,
      messageAdaptations: deriveMessageAdaptations(
        positioning,
        primaryChannel,
        supportChannels,
        copyContext,
      ),
    });
  }

  const subtitle = goalRecapLabel
    ? `Pour votre approche « ${goalRecapLabel} », voici votre promesse en une ligne.`
    : `Votre promesse en une ligne pour ${productName} — on l'adaptera par canal ensuite.`;

  return (
    <CampaignRiverStopShell
      title="On leur dit quoi"
      subtitle={subtitle}
      actionHint="Même histoire partout, formulations différentes selon le canal."
      onConfirm={handleConfirm}
      onBack={onBack}
      onAdjust={() => {
        if (!adjusting) setCustomText(selectedVariant.text);
        setAdjusting((v) => !v);
      }}
      adjusting={adjusting}
    >
      {!adjusting ? (
        <>
          <div className="space-y-3">
            {draft.variants.map((variant) => {
              const selected = variant.id === selectedId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleSelectVariant(variant.id)}
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
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {selected ? <Check className="h-3 w-3" /> : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {selected ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Fil rouge
                          </span>
                        ) : null}
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {variant.title}
                        </p>
                        {variant.recommended ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Suggéré
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">« {variant.text} »</p>
                      <p className="text-xs text-muted-foreground">{variant.hint}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <AdaptationPreview adaptations={adaptations} />
        </>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
              Votre promesse
            </p>
            <textarea
              className="mt-1.5 flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {customText.length}/{MESSAGE_IDEAL_LENGTH} car. · c&apos;est l&apos;idée maîtresse — les
              versions canal se mettent à jour en dessous
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleCycleVariant}>
            Voir d&apos;autres formulations
          </Button>
          <AdaptationPreview adaptations={adaptations} />
        </div>
      )}

      {!adjusting ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Pré-rempli depuis votre cible et votre fiche Idée · {productName}
        </p>
      ) : null}
    </CampaignRiverStopShell>
  );
}
