"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTier } from "@/contexts/tier-context";

type CampaignMessageCardProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  positioning?: string;
  strategyBrief?: string;
  onPositioningChange: (value: string) => void;
  onBriefGenerated: (brief: string) => void;
  collapsed?: boolean;
};

export function CampaignMessageCard({
  project,
  opportunity,
  stage,
  channel,
  profile,
  positioning,
  strategyBrief,
  onPositioningChange,
  onBriefGenerated,
  collapsed,
}: CampaignMessageCardProps) {
  const { tier } = useTier();
  const canUseBuilderBrief = tier === "builder" || tier === "pro";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productName = project.productName ?? opportunity.name;

  if (collapsed && (positioning || strategyBrief)) {
    return (
      <section className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
        <p className="text-sm font-medium">{positioning ?? "Message validé"}</p>
        {strategyBrief ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{strategyBrief}</p>
        ) : null}
      </section>
    );
  }

  async function generateBrief() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          opportunitySlug: opportunity.slug,
          productName,
          profile,
          channelKey: channel,
          acquisitionStage: stage,
          language: "fr",
        }),
      });
      const data = (await res.json()) as { strategyBrief?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Échec génération");
      if (data.strategyBrief) onBriefGenerated(data.strategyBrief);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Étape 2</p>
        <h3 className="mt-1 text-lg font-semibold">Message & positionnement</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          En une phrase : pourquoi votre cible devrait vous écouter maintenant.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="campaign-positioning">Positionnement (1 phrase)</Label>
          <Input
            id="campaign-positioning"
            className="mt-1.5"
            value={positioning ?? ""}
            onChange={(e) => onPositioningChange(e.target.value)}
            placeholder={`${productName} aide [ICP] à [résultat concret]`}
          />
        </div>

        {strategyBrief ? (
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Brief stratégie</p>
              <CopyButton text={strategyBrief} />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {strategyBrief}
            </p>
          </div>
        ) : canUseBuilderBrief ? (
          <Button type="button" onClick={generateBrief} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Générer le brief IA
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Plan Builder requis pour générer le brief automatiquement.
          </p>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!strategyBrief && positioning?.trim() ? (
          <p className="text-xs text-muted-foreground">
            Vous pouvez continuer avec le positionnement seul, ou générer un brief complet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
