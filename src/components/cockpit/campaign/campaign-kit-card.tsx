"use client";

import { useCallback, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { resolveProductName } from "@/lib/portfolio";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import { Button } from "@/components/ui/button";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { CampaignControls } from "@/components/cockpit/campaign/campaign-controls";
import type { ResetCampaignOptions } from "@/lib/portfolio";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";

type CampaignKitCardProps = {
  tool: CampaignTool;
  opportunity: Opportunity;
  project: UserProject;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  kit?: CampaignKit;
  strategyBrief?: string;
  onGenerated: (kit: CampaignKit) => void;
  onRestoreVersion?: (savedAt: string) => void;
  onReset?: (opts?: ResetCampaignOptions) => void;
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

export function CampaignKitCard({
  tool,
  opportunity,
  project,
  channel,
  profile,
  kit,
  strategyBrief,
  onGenerated,
  onRestoreVersion,
  onReset,
}: CampaignKitCardProps) {
  const { tier } = useTier();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productName = resolveProductName(project, opportunity);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign/kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          opportunitySlug: project.opportunitySlug,
          productName,
          toolId: tool.id,
          profile,
          channelKey: channel,
          strategyBrief,
          language: "fr",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de génération");
      onGenerated(data as CampaignKit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [project, productName, tool.id, profile, channel, strategyBrief, onGenerated]);

  return (
    <section className="rounded-xl border-2 border-primary/20 bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-primary">
            Kit — {tool.name}
          </p>
          <h3 className="mt-1 text-lg font-semibold">Prompts & brief</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={tool.deepLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              {tool.openLabel}
            </a>
          </Button>
          {kit?.primaryPrompt && onRestoreVersion && onReset ? (
            <CampaignControls
              project={project}
              currentTool={tool}
              onRestoreVersion={onRestoreVersion}
              onReset={onReset}
            />
          ) : null}
        </div>
      </div>

      {!kit?.primaryPrompt ? (
        <PaywallGate
          requiredTier="builder"
          preview={
            <p className="mt-4 text-sm text-muted-foreground">
              Prompts adaptés à {tool.name} pour votre campagne.
            </p>
          }
          message="Kit campagne IA — Builder"
        >
          <div className="mt-4">
            <Button
              type="button"
              onClick={generate}
              disabled={loading || !hasTier(tier, "builder")}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Générer le kit
            </Button>
          </div>
        </PaywallGate>
      ) : (
        <div className="mt-4 space-y-4">
          {kit.brief ? (
            <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
              <p className="text-xs font-medium text-muted-foreground">Brief</p>
              <pre className="mt-2 whitespace-pre-wrap text-sm">{kit.brief}</pre>
            </div>
          ) : null}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.04] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Prompt principal</p>
              <CopyBtn text={kit.primaryPrompt} />
            </div>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">{kit.primaryPrompt}</pre>
          </div>
          {kit.secondaryPrompts?.map((sp) => (
            <div key={sp.label} className="rounded-lg border border-border/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{sp.label}</p>
                <CopyBtn text={sp.content} />
              </div>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{sp.content}</pre>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={generate} disabled={loading}>
            <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Régénérer
          </Button>
        </div>
      )}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
