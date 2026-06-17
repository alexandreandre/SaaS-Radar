import type { Opportunity } from "@/types/opportunity";
import { hasTier, type Tier } from "@/lib/tier";

/**
 * Champs premium et tier minimal requis pour les recevoir.
 * SECURITE : ces champs sont retires de l'objet AVANT serialisation vers le client
 * pour un utilisateur dont le tier est insuffisant — le paywall n'est plus seulement
 * cosmetique (blur CSS) mais reellement applique cote serveur.
 */
export const PREMIUM_FIELDS: { field: keyof Opportunity; tier: Tier }[] = [
  // Builder
  { field: "claudePrompt", tier: "builder" },
  { field: "infraCosts", tier: "builder" },
  { field: "frenchCompetitors", tier: "builder" },
  { field: "launchTimeline", tier: "builder" },
  { field: "roiInputs", tier: "builder" },
  { field: "tamBreakdown", tier: "builder" },
  { field: "foreignMarketProfile", tier: "builder" },
  // Pro
  { field: "emailTemplates", tier: "pro" },
  { field: "competitionAlerts", tier: "pro" },
  { field: "partnersFR", tier: "pro" },
];

/** Valeur de remplacement pour un champ premier non autorise (preserve le typage). */
function blankValue(current: unknown): unknown {
  if (typeof current === "string") return "";
  if (Array.isArray(current)) return [];
  // objets / undefined -> undefined (champs optionnels)
  return undefined;
}

/**
 * Renvoie une copie de l'opportunite ou les champs premium hors du tier sont vides.
 * Ne mute jamais l'original. Idempotent.
 */
export function gateOpportunityForTier(
  opportunity: Opportunity,
  tier: Tier
): Opportunity {
  const gated: Opportunity = { ...opportunity };
  const record = gated as unknown as Record<string, unknown>;
  for (const { field, tier: required } of PREMIUM_FIELDS) {
    if (hasTier(tier, required)) continue;
    record[field] = blankValue(record[field]);
  }
  return gated;
}
