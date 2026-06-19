"use client";

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  hasCustomProductName,
  resolveProductName,
  type ResetCampaignOptions,
} from "@/lib/portfolio";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import { Button } from "@/components/ui/button";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { CampaignControls } from "@/components/cockpit/campaign/campaign-controls";
import {
  CampaignToolLogo,
  CampaignToolName,
} from "@/components/cockpit/campaign/campaign-tool-logo";
import {
  getCampaignToolOpenHint,
  getCampaignToolPostCopySteps,
} from "@/lib/campaign/tool-content";
import { getCockpitHref } from "@/lib/cockpit-modules";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";
import { cn } from "@/lib/utils";

type CampaignRecipeCardProps = {
  tool: CampaignTool;
  opportunity: Opportunity;
  project: UserProject;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  kit?: CampaignKit;
  strategyBrief?: string;
  collapsed?: boolean;
  onGenerated: (kit: CampaignKit, strategyBrief?: string) => void;
  onRestoreVersion?: (savedAt: string) => void;
  onReset?: (opts?: ResetCampaignOptions) => void;
};

function KitSection({
  title,
  subtitle,
  children,
  variant = "guide",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  variant?: "guide" | "prompt";
}) {
  return (
    <section
      className={cn(
        variant === "prompt"
          ? "rounded-xl border-2 border-primary/30 bg-primary/[0.04] p-4 shadow-sm"
          : "rounded-xl border border-border/70 bg-background p-4",
      )}
    >
      <header className="mb-3">
        <h4
          className={cn(
            "text-sm font-semibold",
            variant === "prompt" ? "text-primary" : "text-foreground",
          )}
        >
          {title}
        </h4>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function PromptCopyBlock({ text, tool }: { text: string; tool: CampaignTool }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-primary/20 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 bg-primary/5 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>
            Texte à coller dans <CampaignToolName toolId={tool.id} size="xs" />
          </span>
        </div>
        <Button type="button" size="sm" className="h-8 gap-1.5" onClick={() => void handleCopy()}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Prompt copié" : "Copier le prompt"}
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-foreground/90">
        {text}
      </pre>
    </div>
  );
}

export function CampaignRecipeCard({
  tool,
  opportunity,
  project,
  channel,
  profile,
  kit,
  strategyBrief,
  collapsed = false,
  onGenerated,
  onRestoreVersion,
  onReset,
}: CampaignRecipeCardProps) {
  const { tier } = useTier();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productName = resolveProductName(project, opportunity);
  const openHint = getCampaignToolOpenHint(tool.id);
  const postCopySteps = getCampaignToolPostCopySteps(tool.id);

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
      onGenerated(data as CampaignKit, data.strategyBrief as string | undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [project, productName, tool.id, profile, channel, strategyBrief, onGenerated]);

  if (collapsed && kit?.primaryPrompt) {
    return (
      <details className="rounded-xl border border-border bg-card shadow-card">
        <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <CampaignToolLogo toolId={tool.id} size="sm" />
            <span className="font-medium">Kit campagne — {tool.name}</span>
          </div>
        </summary>
        <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
          <PromptCopyBlock text={kit.primaryPrompt} tool={tool} />
        </div>
      </details>
    );
  }

  return (
    <section
      id="campaign-recipe"
      className="rounded-xl border border-border bg-card p-5 shadow-card"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <CampaignToolLogo toolId={tool.id} size="lg" />
          <div className="min-w-0">
            <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
              Généré pour {tool.name}
            </p>
            <h3 className="mt-1 text-lg font-semibold">Votre kit campagne</h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={tool.deepLink} target="_blank" rel="noopener noreferrer" className="gap-2">
              <CampaignToolLogo toolId={tool.id} size="sm" variant="inline" />
              Ouvrir {tool.name}
              <ExternalLink className="h-3.5 w-3.5" />
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

      {!hasCustomProductName(project) ? (
        <p className="mb-4 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
          Nommez votre produit dans{" "}
          <Link
            href={getCockpitHref(project.id, "build")}
            className="font-medium text-foreground underline"
          >
            Build
          </Link>{" "}
          pour des prompts plus précis.
        </p>
      ) : null}

      {!kit?.primaryPrompt ? (
        <PaywallGate
          requiredTier="builder"
          preview={
            <p className="text-sm text-muted-foreground">
              Prompts adaptés à {tool.name} pour votre campagne {productName}.
            </p>
          }
          message="Kit campagne IA — Builder"
        >
          <div className="mt-2 flex justify-center">
            <Button
              type="button"
              className="gap-2"
              onClick={() => void generate()}
              disabled={loading || !hasTier(tier, "builder")}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Générer mon kit campagne
            </Button>
          </div>
        </PaywallGate>
      ) : (
        <div className="space-y-4">
          <PromptCopyBlock text={kit.primaryPrompt} tool={tool} />

          {kit.brief ? (
            <KitSection title="Brief créatif" subtitle="Résumé pour guider vos contenus">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {kit.brief}
              </pre>
            </KitSection>
          ) : null}

          {strategyBrief ? (
            <details className="rounded-xl border border-border/70 bg-muted/10 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                Stratégie (détail)
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {strategyBrief}
              </pre>
            </details>
          ) : null}

          {kit.secondaryPrompts?.map((sp) => (
            <details
              key={sp.label}
              className="rounded-xl border border-border/70 bg-background px-4 py-3"
            >
              <summary className="cursor-pointer text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                {sp.label}
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
                {sp.content}
              </pre>
            </details>
          ))}

          <KitSection
            title="Comment utiliser ce kit"
            subtitle="Copier → coller → publier"
          >
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">1.</span>
                Copiez le prompt principal
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">2.</span>
                {openHint ?? `Collez dans ${tool.name}`}
              </li>
              {postCopySteps.slice(2).map((step, i) => (
                <li key={step} className="flex gap-2">
                  <span className="font-semibold text-primary">{i + 3}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </KitSection>

          <div className="flex justify-center">
            <Button type="button" variant="outline" size="sm" onClick={() => void generate()} disabled={loading}>
              <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Régénérer
            </Button>
          </div>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
