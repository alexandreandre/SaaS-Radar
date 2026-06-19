"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import { getStageDefinition } from "@/lib/campaign/stages";
import {
  filterToolsForStage,
  recommendTools,
} from "@/lib/campaign/recommend";
import { getToolsByChannel } from "@/lib/campaign/tools";
import { CampaignRecipeCard } from "@/components/cockpit/campaign/campaign-recipe-card";
import { CampaignToolLogo } from "@/components/cockpit/campaign/campaign-tool-logo";
import { COMMUNITY_TARGETS } from "@/lib/campaign/communities";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import type { ConnectorId } from "@/lib/connectors/types";
import { getConnector } from "@/lib/connectors/registry";

type CampaignPrepareCardProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  activeTool?: CampaignTool;
  activeKit?: CampaignKit;
  strategyBrief?: string;
  trackingUtm?: string;
  onSelectTool: (tool: CampaignTool) => void;
  onKitGenerated: (kit: CampaignKit, strategyBrief?: string) => void;
  onRestoreVersion: (savedAt: string) => void;
  onReset: (opts?: { keepStrategy?: boolean }) => void;
  onConfigureTracking: () => void;
  onConnectIntegration: (id: ConnectorId) => void;
};

export function CampaignPrepareCard({
  project,
  opportunity,
  stage,
  channel,
  profile,
  activeTool,
  activeKit,
  strategyBrief,
  trackingUtm,
  onSelectTool,
  onKitGenerated,
  onRestoreVersion,
  onReset,
  onConfigureTracking,
  onConnectIntegration,
}: CampaignPrepareCardProps) {
  const stageDef = getStageDefinition(stage);
  const tools = filterToolsForStage(getToolsByChannel(channel, profile), stage);
  const recommended = new Set(recommendTools(opportunity, profile, channel, stage));
  const requiredConnectors = project.campaignSetup?.trackingPlan?.requiredConnectors ?? [];

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4">
          <p className="font-data text-[10px] uppercase tracking-data text-primary">Étape 3</p>
          <h3 className="mt-1 text-lg font-semibold">Préparer outils & mesure</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {stageDef.showPaidAds
              ? "Assets créatifs + tracking avant de lancer."
              : "Pas de pub à ce stade — focus outreach et contenu."}
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">Outils recommandés</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {tools.slice(0, 6).map((tool) => {
              const isSelected = activeTool?.id === tool.id;
              const isRecommended = recommended.has(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelectTool(tool)}
                  className={cn(
                    "flex gap-3 rounded-xl border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-muted/20 hover:border-primary/40",
                  )}
                >
                  <CampaignToolLogo toolId={tool.id} size="sm" className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {tool.name}
                      {isRecommended ? (
                        <span className="ml-2 text-[10px] font-medium uppercase text-primary">
                          Reco
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{tool.pitch}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {(stage === "network" || stage === "content") && (
          <details className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">
              Communautés à activer
            </summary>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {COMMUNITY_TARGETS.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {c.name}
                  </a>
                  — {c.whenToMentionProduct}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Tracking UTM</p>
            {trackingUtm ? <CopyButton text={trackingUtm} /> : null}
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
            {trackingUtm ?? "Configurez après validation de l'URL produit."}
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={onConfigureTracking}>
            Marquer le tracking configuré
          </Button>
        </div>

        {requiredConnectors.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Connecteurs mesure</p>
            <div className="flex flex-wrap gap-2">
              {requiredConnectors.map((id) => {
                const connected = (project.integrations ?? []).some(
                  (i) => i.connectorId === id && (i.status === "connected" || i.status === "demo"),
                );
                return (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={connected ? "secondary" : "outline"}
                    onClick={() => onConnectIntegration(id)}
                  >
                    {getConnector(id)?.name ?? id}
                    {connected ? " ✓" : ""}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {activeTool ? (
        <CampaignRecipeCard
          tool={activeTool}
          opportunity={opportunity}
          project={project}
          channel={channel}
          profile={profile}
          kit={activeKit}
          strategyBrief={strategyBrief}
          collapsed={false}
          onGenerated={onKitGenerated}
          onRestoreVersion={onRestoreVersion}
          onReset={onReset}
        />
      ) : null}
    </section>
  );
}
