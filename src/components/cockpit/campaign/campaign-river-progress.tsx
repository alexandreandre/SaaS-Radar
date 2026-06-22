"use client";

import { cn } from "@/lib/utils";

type CampaignRiverProgressProps = {
  activeIndex: number;
  className?: string;
};

const LABELS = ["Cible", "Objectif", "Message"];

export function CampaignRiverProgress({ activeIndex, className }: CampaignRiverProgressProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {LABELS.map((label, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                done ? "bg-emerald-500" : current ? "bg-primary" : "bg-muted-foreground/30",
              )}
              aria-hidden
            />
            {i < LABELS.length - 1 ? (
              <span className="h-px w-6 bg-border sm:w-10" aria-hidden />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
