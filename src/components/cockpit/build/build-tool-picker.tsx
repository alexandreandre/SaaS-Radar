"use client";

import { Code2, Sparkles, Wand2 } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  BUILD_TOOL_LEVELS,
  getToolsByLevel,
  recommendLevel,
  type BuildTool,
  type BuildToolLevel,
} from "@/lib/build/tools";
import { cn } from "@/lib/utils";
import { BuildToolLogo } from "@/components/cockpit/build/build-tool-logo";

type BuildToolPickerProps = {
  project: UserProject;
  opportunity: Opportunity;
  selectedLevel?: BuildToolLevel;
  selectedToolId?: string;
  onLevelSelect: (level: BuildToolLevel) => void;
  onSelect: (tool: BuildTool) => void;
};

const LEVEL_META: Record<
  BuildToolLevel,
  { icon: typeof Wand2; tagline: string }
> = {
  nocode: {
    icon: Wand2,
    tagline: "Je ne code pas — l'IA construit pour moi",
  },
  intermediate: {
    icon: Sparkles,
    tagline: "Je veux un peu contrôler, toujours guidé",
  },
  advanced: {
    icon: Code2,
    tagline: "Je code avec l'IA sur mon poste",
  },
};

export function BuildToolPicker({
  project,
  opportunity,
  selectedLevel,
  selectedToolId,
  onLevelSelect,
  onSelect,
}: BuildToolPickerProps) {
  const suggestedLevel = recommendLevel(project, opportunity);
  const activeLevel = selectedLevel ?? suggestedLevel;
  const tools = getToolsByLevel(activeLevel);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Mon build</p>
        <h3 className="mt-1 text-lg font-semibold">Comment voulez-vous construire ?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vous pourrez changer d&apos;outil à tout moment.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">1. Votre niveau</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["nocode", "intermediate", "advanced"] as BuildToolLevel[]).map((level) => {
            const meta = BUILD_TOOL_LEVELS[level];
            const extra = LEVEL_META[level];
            const Icon = extra.icon;
            const isActive = activeLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onLevelSelect(level)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-muted/20 hover:border-primary/40",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <p className="mt-2 font-semibold">{meta.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{extra.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium">2. Votre outil</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {tools.map((tool) => {
            const isSelected = selectedToolId === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelect(tool)}
                className={cn(
                  "flex gap-3 rounded-xl border p-4 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-muted/20 hover:border-primary/40",
                )}
              >
                <BuildToolLogo toolId={tool.id} size="md" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{tool.name}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {tool.pitch}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
