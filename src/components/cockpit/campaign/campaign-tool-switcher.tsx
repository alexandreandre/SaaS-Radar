"use client";

import { Plus, X } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import {
  getActiveCampaignToolId,
  getCampaignToolIdsInOrder,
  getSavedCampaignToolIds,
} from "@/lib/portfolio";
import { getCampaignTool, type CampaignToolId } from "@/lib/campaign/tools";
import { cn } from "@/lib/utils";

type CampaignToolSwitcherProps = {
  project: UserProject;
  onSwitch: (toolId: CampaignToolId) => void;
  onRemove?: (toolId: CampaignToolId) => void;
  onAddTool: () => void;
};

export function CampaignToolSwitcher({
  project,
  onSwitch,
  onRemove,
  onAddTool,
}: CampaignToolSwitcherProps) {
  const activeId = getActiveCampaignToolId(project);
  const toolIds = getCampaignToolIdsInOrder(project);
  const savedIds = new Set(getSavedCampaignToolIds(project));

  if (toolIds.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="w-full font-data text-[10px] uppercase tracking-data text-muted-foreground sm:mr-1 sm:w-auto">
        Mes outils
      </p>
      {toolIds.map((id) => {
        const tool = getCampaignTool(id);
        if (!tool) return null;
        const isActive = id === activeId;
        const hasKit = savedIds.has(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSwitch(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <span className="font-medium">{tool.name}</span>
            {hasKit ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                title="Kit sauvegardé"
              />
            ) : null}
            {onRemove && toolIds.length > 1 ? (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Retirer ${tool.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(id);
                  }
                }}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </span>
            ) : null}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAddTool}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Autre
      </button>
    </div>
  );
}
