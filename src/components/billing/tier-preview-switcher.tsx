"use client";

import { useTier } from "@/contexts/tier-context";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/tier";
import { tierLabels } from "@/lib/tier";

const tiers: Tier[] = ["free", "builder", "pro"];

export function TierPreviewSwitcher({
  className,
  allowInProd = false,
}: {
  className?: string;
  /** Reserve aux super-admins : autorise le switcher meme en production. */
  allowInProd?: boolean;
}) {
  const { tier, setTier, isAuthenticated } = useTier();

  // En prod, le tier est autoritatif cote serveur : on ne propose plus l'apercu
  // librement (un Free pourrait sinon se donner Pro). Reserve au dev ou aux super-admins.
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev && !allowInProd) return null;
  // Pour un compte authentifie, setTier est de toute facon un no-op (serveur gagne) :
  // on masque le switcher hors mode admin pour eviter une UI trompeuse.
  if (isAuthenticated && !allowInProd) return null;

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
