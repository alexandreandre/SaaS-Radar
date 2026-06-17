"use client";

import { Plus } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import {
  getActiveBuildToolId,
  getBuildToolIdsInOrder,
  getSavedBuildToolIds,
} from "@/lib/portfolio";
import { getBuildTool, type BuildToolId } from "@/lib/build/tools";
import { BuildToolLogo } from "@/components/cockpit/build/build-tool-logo";
import { cn } from "@/lib/utils";

type BuildToolSwitcherProps = {
  project: UserProject;
  onSwitch: (toolId: BuildToolId) => void;
  onAddTool: () => void;
};

export function BuildToolSwitcher({
  project,
  onSwitch,
  onAddTool,
}: BuildToolSwitcherProps) {
  const activeId = getActiveBuildToolId(project);
  const toolIds = getBuildToolIdsInOrder(project);
  const savedIds = new Set(getSavedBuildToolIds(project));

  if (toolIds.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="w-full font-data text-[10px] uppercase tracking-data text-muted-foreground sm:w-auto sm:mr-1">
        Mes outils
      </p>
      {toolIds.map((id) => {
        const tool = getBuildTool(id);
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
            <BuildToolLogo toolId={id} size="xs" variant="inline" />
            <span className="font-medium">{tool.name}</span>
            {hasKit ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                title="Kit sauvegardé"
              />
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
