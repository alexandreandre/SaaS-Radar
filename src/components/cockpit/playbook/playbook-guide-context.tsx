"use client";

import { ArrowRight, BookOpen, Hammer } from "lucide-react";
import type { CockpitModuleId } from "@/lib/cockpit-modules";

type PlaybookGuideContextProps = {
  onModuleChange?: (module: CockpitModuleId) => void;
};

export function PlaybookGuideContextBanner({ onModuleChange }: PlaybookGuideContextProps) {
  if (!onModuleChange) return null;

  return (
    <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
      <div className="flex items-start gap-2">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground">Plan éditorial vs journal d&apos;exécution</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ce guide détaille quoi faire jour par jour (J1→J14). Vos cases à cocher sont dans le
            journal Build (semaines S1–S4).
          </p>
          <button
            type="button"
            onClick={() => onModuleChange("build")}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Hammer className="h-3.5 w-3.5" />
            Ouvrir le journal Build
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
