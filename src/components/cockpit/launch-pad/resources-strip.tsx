"use client";

import { BookOpen, Hammer, Layers, Sparkles, Users } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { getMvpStackPreview } from "@/lib/build-launch";

type ResourcesStripProps = {
  opportunity: Opportunity;
  onOpenPlaybook: (tab?: string) => void;
  onOpenBuild?: () => void;
};

export function ResourcesStrip({
  opportunity,
  onOpenPlaybook,
  onOpenBuild,
}: ResourcesStripProps) {
  const stack = getMvpStackPreview(opportunity, 5);

  return (
    <details className="group rounded-lg border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
        Ressources rapides
      </summary>
      <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
        {stack.length > 0 ? (
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Stack MVP
            </div>
            <p className="mt-1.5 text-sm">{stack.join(" · ")}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (onOpenBuild ? onOpenBuild() : onOpenPlaybook())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Hammer className="h-3.5 w-3.5" />
            Recette Build
          </button>
          <button
            type="button"
            onClick={() => (onOpenBuild ? onOpenBuild() : onOpenPlaybook())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Prompts MVP
          </button>
          <button
            type="button"
            onClick={() => onOpenPlaybook("clients")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/50"
          >
            <Users className="h-3.5 w-3.5" />
            Trouver clients
          </button>
          <button
            type="button"
            onClick={() => onOpenPlaybook("finances")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/50"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Simulateur MRR
          </button>
        </div>
      </div>
    </details>
  );
}
