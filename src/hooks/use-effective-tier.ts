"use client";

import { useTier } from "@/contexts/tier-context";
import { resolveOpportunityAccessTier } from "@/lib/product-phase";
import type { Tier } from "@/lib/tier";

/** Tier effectif pour paywalls et TOC des fiches opportunités. */
export function useEffectiveTier(): Tier {
  const { tier } = useTier();
  return resolveOpportunityAccessTier(tier);
}
