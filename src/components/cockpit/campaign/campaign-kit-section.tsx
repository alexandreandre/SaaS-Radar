"use client";

import { useMemo } from "react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignTool } from "@/lib/campaign/tools";
import type { MarketingProfile } from "@/lib/campaign/tools";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getVisiblePlaybooks } from "@/lib/campaign/playbooks";
import { filterToolsForStage, recommendTools } from "@/lib/campaign/recommend";
import { getToolsByChannel } from "@/lib/campaign/tools";
import { CampaignRecipeCard } from "@/components/cockpit/campaign/campaign-recipe-card";
import { CampaignToolLogo } from "@/components/cockpit/campaign/campaign-tool-logo";
import { cn } from "@/lib/utils";

type CampaignKitSectionProps = {
  project: UserProject;
  opportunity: Opportunity;
  stage: AcquisitionStage;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  strategyBrief?: string;
  activeTool?: CampaignTool;
  activeKit?: CampaignKit;
  onSelectTool: (tool: CampaignTool) => void;
  onKitGenerated: (kit: CampaignKit, strategyBrief?: string) => void;
  onRestoreVersion: (savedAt: string) => void;
  onReset: (opts?: { keepStrategy?: boolean }) => void;
};

export function CampaignKitSection({
  project,
  opportunity,
  stage,
  channel,
  profile,
  strategyBrief,
  activeTool,
  activeKit,
  onSelectTool,
  onKitGenerated,
  onRestoreVersion,
  onReset,
}: CampaignKitSectionProps) {
  const playbooks = useMemo(
    () => getVisiblePlaybooks(stage, channel, opportunity),
    [stage, channel, opportunity],
  );
  const primary = playbooks.find((p) => p.relevance === "primary") ?? playbooks[0];
  const toolChannel = primary?.toolChannel ?? channel;
  const tools = filterToolsForStage(getToolsByChannel(toolChannel, profile), stage);
  const recommended = new Set(recommendTools(opportunity, profile, toolChannel, stage));
  const isPrimaryTool =
    activeTool && recommended.has(activeTool.id) && toolChannel === primary?.toolChannel;

  if (!primary) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">
          Canal prioritaire
        </p>
        <p className="text-sm font-semibold">{primary.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{primary.description}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <p className="mb-3 text-sm font-medium">Stack outils</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {tools.slice(0, 4).map((tool) => {
            const isSelected = activeTool?.id === tool.id && isPrimaryTool;
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
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                    <span>{tool.name}</span>
                    {isRecommended ? (
                      <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-primary">
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

      {activeTool && isPrimaryTool ? (
        <CampaignRecipeCard
          tool={activeTool}
          opportunity={opportunity}
          project={project}
          channel={toolChannel}
          profile={profile}
          kit={activeKit}
          strategyBrief={strategyBrief}
          collapsed={false}
          onGenerated={onKitGenerated}
          onRestoreVersion={onRestoreVersion}
          onReset={onReset}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Sélectionnez un outil pour générer votre kit {primary.label}.
        </p>
      )}
    </section>
  );
}
