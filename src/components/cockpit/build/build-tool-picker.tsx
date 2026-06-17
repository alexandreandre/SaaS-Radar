"use client";

import { Sparkles } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  BUILD_TOOL_LEVELS,
  getToolsByLevel,
  recommendTool,
  type BuildTool,
  type BuildToolLevel,
} from "@/lib/build/tools";
import { cn } from "@/lib/utils";

type BuildToolPickerProps = {
  project: UserProject;
  opportunity: Opportunity;
  selectedToolId?: string;
  onSelect: (tool: BuildTool) => void;
};

const LEVEL_ORDER: BuildToolLevel[] = ["nocode", "intermediate", "advanced"];

export function BuildToolPicker({
  project,
  opportunity,
  selectedToolId,
  onSelect,
}: BuildToolPickerProps) {
  const recommendedId = recommendTool(project, opportunity);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Mon build</p>
        <h3 className="mt-1 text-lg font-semibold">Choisissez votre outil</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Selon votre niveau — nous adaptons le prompt et le guide de déploiement.
        </p>
      </div>

      <div className="space-y-5">
        {LEVEL_ORDER.map((level) => {
          const meta = BUILD_TOOL_LEVELS[level];
          const tools = getToolsByLevel(level);
          return (
            <div key={level}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {meta.label}
              </p>
              <p className="mb-3 text-xs text-muted-foreground">{meta.description}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
                  const isSelected = selectedToolId === tool.id;
                  const isRecommended = recommendedId === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onSelect(tool)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-muted/20 hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{tool.name}</span>
                        {isRecommended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Sparkles className="h-3 w-3" />
                            Recommandé
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{tool.pitch}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
