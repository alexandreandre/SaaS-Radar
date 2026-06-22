import { hasTier, type Tier } from "@/lib/tier";

export type ProductPhase = "discovery" | "full";

/** Phase produit (NEXT_PUBLIC — lisible client et serveur). Défaut discovery = prod safe. */
export function getProductPhase(): ProductPhase {
  const raw = process.env.NEXT_PUBLIC_PRODUCT_PHASE?.trim();
  return raw === "full" ? "full" : "discovery";
}

export function isDiscoveryPhase(): boolean {
  return getProductPhase() === "discovery";
}

/** Cockpit / build / campagne accessibles (preview full ou admin en prod discovery). */
export function isCockpitEnabled(isAdminUser = false): boolean {
  if (isAdminUser) return true;
  return getProductPhase() === "full";
}

export function isCheckoutEnabled(): boolean {
  return getProductPhase() === "full";
}

/** Carte interactive : clic requis (discovery et full). */
export function isMapDefaultUnlocked(): boolean {
  return false;
}

/**
 * Tier effectif pour la lecture éditoriale des fiches opportunités.
 * En discovery : free → builder, pro inchangé.
 */
export function resolveOpportunityAccessTier(userTier: Tier): Tier {
  if (!isDiscoveryPhase()) return userTier;
  if (userTier === "pro") return "pro";
  return "builder";
}

export const DISCOVERY_PAYWALL_MESSAGE =
  "Le cockpit de build arrive bientôt. Inscrivez-vous à la newsletter pour être informé en premier.";

export const DISCOVERY_NEWSLETTER_CTA = "Être informé à l'ouverture";

/** Sections TOC : exécution (prompt, guide) non élevées en discovery. */
const DISCOVERY_EXECUTION_SECTIONS = new Set(["prompt", "guide"]);

/**
 * Accès affiché pour une section de fiche (TOC, paywalls éditoriaux).
 */
export function hasDetailSectionAccess(
  userTier: Tier,
  required: Tier,
  sectionId?: string,
): boolean {
  if (sectionId && isDiscoveryPhase() && DISCOVERY_EXECUTION_SECTIONS.has(sectionId)) {
    return hasTier(userTier, required);
  }
  return hasTier(resolveOpportunityAccessTier(userTier), required);
}
