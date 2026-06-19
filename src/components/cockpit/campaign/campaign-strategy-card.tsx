"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { resolveProductName } from "@/lib/portfolio";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import { Button } from "@/components/ui/button";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";

type CampaignStrategyCardProps = {
  project: UserProject;
  opportunity: Opportunity;
  profile: MarketingProfile;
  channel: ExtendedChannelKey;
  strategyBrief?: string;
  onGenerated: (brief: string) => void;
};

export function CampaignStrategyCard({
  project,
  opportunity,
  profile,
  channel,
  strategyBrief,
  onGenerated,
}: CampaignStrategyCardProps) {
  const { tier } = useTier();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productName = resolveProductName(project, opportunity);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          opportunitySlug: project.opportunitySlug,
          productName,
          profile,
          channelKey: channel,
          language: "fr",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de génération");
      onGenerated(data.strategyBrief);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">
        Étape 1 — Stratégie
      </p>
      <h3 className="mt-1 text-lg font-semibold">Brief campagne</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Positionnement, messages clés et angle pour {productName}.
      </p>

      {strategyBrief ? (
        <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-4">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {strategyBrief}
          </pre>
        </div>
      ) : (
        <PaywallGate
          requiredTier="builder"
          preview={
            <p className="mt-4 text-sm text-muted-foreground">
              Brief stratégie généré par IA depuis votre fiche opportunité.
            </p>
          }
          message="Brief campagne IA — Builder"
        >
          <div className="mt-4">
            <Button type="button" onClick={generate} disabled={loading || !hasTier(tier, "builder")}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Générer le brief
            </Button>
          </div>
        </PaywallGate>
      )}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      {strategyBrief ? (
        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={generate} disabled={loading}>
            Régénérer
          </Button>
        </div>
      ) : null}
    </section>
  );
}
