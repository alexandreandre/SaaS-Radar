import type { CacChannel } from "@/types/opportunity";

/** Slugs OpenRouter — vérifiés actifs via assertModelsActive() au démarrage. */
export const MODELS = {
  /** Recherche web initiale (1 appel par run, volume ∝ count). */
  discovery: "perplexity/sonar-pro",
  /** Fact-check / enrichissement traction ciblé (sonar standard, ~10× moins cher que pro). */
  verify: "perplexity/sonar",
  structure: "google/gemini-2.5-flash",
} as const;

/** Secteurs autorisés (alignés sur le check SQL et le type Opportunity). */
export const SECTORS = [
  "healthcare",
  "construction",
  "hr",
  "finance",
  "legal",
  "retail",
  "education",
  "hospitality",
] as const;

export const CLIENT_TYPES = ["b2b", "b2c"] as const;
export const TECH_COMPLEXITY = ["low", "medium", "high"] as const;
export const FRANCE_COMPETITION = ["none", "low", "medium", "high"] as const;

/**
 * Patterns reconnus par src/lib/stack-health.ts (STACK_CONNECTOR_MAP).
 * Au moins un item de mvpPlan.stack doit matcher, sinon Stack Health tombe à vide.
 */
export const MAPPABLE_STACK_PATTERNS = [
  "stripe",
  "supabase",
  "resend",
  "next.js",
  "tailwind",
  "plausible",
  "posthog",
] as const;

/**
 * Patterns reconnus par src/lib/stack-health.ts (CHANNEL_CONNECTOR_MAP).
 * Au moins un cacChannels[].channel doit matcher.
 */
export const MAPPABLE_CHANNEL_PATTERNS = [
  "cold email",
  "linkedin",
  "seo",
  "google",
  "meta",
  "referral",
] as const;

/** Stack canonique injectée par le code → garantit la mappabilité Stack Health. */
export const CANONICAL_STACK = [
  "Next.js 14",
  "Supabase",
  "Stripe",
  "Tailwind CSS",
  "Resend",
] as const;

/** Canaux d'acquisition canoniques (mappables) injectés par le code. */
export const CANONICAL_CAC: CacChannel[] = [
  { channel: "Cold email", estimate: 80, note: "Liste qualifiée, 3 relances max" },
  { channel: "LinkedIn", estimate: 200, note: "Outreach fondateur + contenu niche" },
  { channel: "SEO", estimate: 40, note: "Long terme, mots-clés métier FR" },
  { channel: "Referral", estimate: 30, note: "Partenariats cabinets / associations" },
];

/** @deprecated Import depuis @/lib/scoring/rubric — conservé pour rétrocompat. */
export { SCORE_WEIGHTS } from "@/lib/scoring/rubric";

/** Paramètres de run par défaut. */
export const DEFAULT_COUNT = 3;
/** @deprecated Utiliser resolveSourcingScale — conservé pour scripts legacy. */
export const OVERFETCH_FACTOR = 4;
/** @deprecated Utiliser resolveSourcingScale. */
export const OVERFETCH_MIN = 12;
/** Plafond de leads demandés à Sonar par appel (évite JSON tronqué). */
export const MAX_DISCOVERY_REQUEST = 24;
/** Nombre maximum de rounds Sonar (runs volumineux uniquement). */
export const MAX_DISCOVERY_ROUNDS = 2;
/** Signaux de traction sourcés minimum après élagage des URLs mortes. */
export const MIN_TRACTION_SIGNALS = 2;
/** Catégories traction minimum (mrr, authority, community). */
export const MIN_TRACTION_CATEGORIES = 2;

export type SourcingScale = {
  /** Leads demandés à Sonar (recherche web, 1 appel / round). */
  discoveryRequest: number;
  /** Candidats max structurés (Gemini) — plafond d'écriture = count. */
  maxLeads: number;
  /** Rounds de découverte Sonar. */
  maxRounds: number;
};

/**
 * Dimensionnement linéaire du run : coût ≈ O(count).
 * count=1 → Sonar ~3 leads, Gemini ≤2 tentatives max.
 * count=5 → Sonar ~7 leads, etc.
 */
export function resolveSourcingScale(count: number): SourcingScale {
  const target = Math.max(1, count);
  const processBuffer = Math.min(Math.max(1, Math.ceil(target / 3)), 3);
  const maxLeads = target + processBuffer;
  return {
    maxLeads,
    discoveryRequest: Math.min(maxLeads + 1, MAX_DISCOVERY_REQUEST),
    maxRounds: target <= 5 ? 1 : MAX_DISCOVERY_ROUNDS,
  };
}

/** @deprecated Préférer resolveSourcingScale().maxLeads */
export function resolveMaxLeadsToProcess(count: number, _catalogue?: boolean): number {
  return resolveSourcingScale(count).maxLeads;
}

/** @deprecated Préférer resolveSourcingScale().discoveryRequest */
export function resolveDiscoveryRequestCount(count: number, _overfetchFactor?: number): number {
  return resolveSourcingScale(count).discoveryRequest;
}

export function resolveMaxDiscoveryRounds(count: number): number {
  return resolveSourcingScale(count).maxRounds;
}
