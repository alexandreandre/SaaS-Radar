"use client";

import { useTier } from "@/contexts/tier-context";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/tier";
import { tierLabels } from "@/lib/tier";

const tiers: Tier[] = ["free", "builder", "pro"];

export function TierPreviewSwitcher({ className }: { className?: string }) {
  const { tier, setTier } = useTier();

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>
      <span className="font-data text-[10px] font-medium uppercase tracking-data text-map-muted">
        Aperçu du plan
      </span>
      <div className="inline-flex rounded-md border border-map-border bg-hero/50 p-0.5">
        {tiers.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTier(t)}
            className={cn(
              "rounded-sm px-3 py-1.5 font-data text-[10px] font-medium uppercase tracking-data transition-colors",
              tier === t
                ? "bg-primary text-primary-foreground"
                : "text-map-muted hover:text-hero-foreground"
            )}
          >
            {tierLabels[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
