"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  getToolsByChannel,
  getCampaignTool,
  type CampaignTool,
  type CampaignToolId,
  type MarketingProfile,
} from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { recommendTools } from "@/lib/campaign/recommend";
import { cn } from "@/lib/utils";

type CampaignToolPickerProps = {
  project: UserProject;
  opportunity: Opportunity;
  profile: MarketingProfile;
  channel: ExtendedChannelKey;
  selectedToolIds?: CampaignToolId[];
  onSelect: (tool: CampaignTool) => void;
};

export function CampaignToolPicker({
  opportunity,
  profile,
  channel,
  selectedToolIds = [],
  onSelect,
}: CampaignToolPickerProps) {
  const tools = getToolsByChannel(channel, profile);
  const recommended = new Set(recommendTools(opportunity, profile, channel));

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">
          Stack créatif
        </p>
        <h3 className="mt-1 text-lg font-semibold">Choisissez vos outils</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vous pouvez en combiner plusieurs pour la même campagne.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {tools.map((tool) => {
          const isSelected = selectedToolIds.includes(tool.id);
          const isRecommended = recommended.has(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{tool.name}</p>
                {isRecommended ? (
                  <span className="shrink-0 text-[10px] font-medium uppercase text-primary">
                    Reco
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{tool.pitch}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{tool.pricingHint}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CampaignToolPickerDialog({
  open,
  onOpenChange,
  project,
  opportunity,
  profile,
  channel,
  selectedToolIds,
  onSelect,
}: CampaignToolPickerProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-medium">Ajouter un outil</p>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </button>
        </div>
        <div className="p-4">
          <CampaignToolPicker
            project={project}
            opportunity={opportunity}
            profile={profile}
            channel={channel}
            selectedToolIds={selectedToolIds}
            onSelect={(tool) => {
              onSelect(tool);
              onOpenChange(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function getToolDisplayName(id: CampaignToolId): string {
  return getCampaignTool(id)?.name ?? id;
}
