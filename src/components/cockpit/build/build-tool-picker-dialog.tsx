"use client";

import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getSavedBuildToolIds } from "@/lib/portfolio";
import {
  BUILD_TOOL_LEVELS,
  getToolsByLevel,
  recommendLevel,
  type BuildTool,
  type BuildToolLevel,
} from "@/lib/build/tools";
import { BuildToolLogo } from "@/components/cockpit/build/build-tool-logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BuildToolPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: UserProject;
  opportunity: Opportunity;
  selectedLevel?: BuildToolLevel;
  onLevelSelect: (level: BuildToolLevel) => void;
  onSelect: (tool: BuildTool) => void;
};

export function BuildToolPickerDialog({
  open,
  onOpenChange,
  project,
  opportunity,
  selectedLevel,
  onLevelSelect,
  onSelect,
}: BuildToolPickerDialogProps) {
  const activeLevel = selectedLevel ?? recommendLevel(project, opportunity);
  const tools = getToolsByLevel(activeLevel);
  const savedIds = new Set(getSavedBuildToolIds(project));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choisir un outil</DialogTitle>
          <DialogDescription>
            Basculez entre outils — chaque kit est sauvegardé séparément.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {(["nocode", "intermediate", "advanced"] as BuildToolLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onLevelSelect(level)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                activeLevel === level
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {BUILD_TOOL_LEVELS[level].label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {tools.map((tool) => {
            const hasKit = savedIds.has(tool.id);
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  onSelect(tool);
                  onOpenChange(false);
                }}
                className="flex gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <BuildToolLogo toolId={tool.id} size="md" className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{tool.name}</span>
                    {hasKit ? (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                        Kit sauvegardé
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{tool.pitch}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
