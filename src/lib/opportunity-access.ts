import type { Opportunity } from "@/types/opportunity";
import { resolveOpportunityAccessTier, isDiscoveryPhase } from "@/lib/product-phase";
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

/** Exécution (prompt, emails) — reste gated en phase discovery même pour visiteurs. */
const DISCOVERY_EXECUTION_FIELDS = new Set<keyof Opportunity>([
  "claudePrompt",
  "emailTemplates",
  "competitionAlerts",
  "partnersFR",
]);

function accessTierForField(field: keyof Opportunity, userTier: Tier): Tier {
  if (isDiscoveryPhase() && DISCOVERY_EXECUTION_FIELDS.has(field)) {
    return userTier;
  }
  return resolveOpportunityAccessTier(userTier);
}

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
    const accessTier = accessTierForField(field, tier);
    if (hasTier(accessTier, required)) continue;
    record[field] = blankValue(record[field]);
  }
  return gated;
}
