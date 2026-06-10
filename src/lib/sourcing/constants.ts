import type { CacChannel } from "@/types/opportunity";

/** Slugs OpenRouter — vérifiés actifs via assertModelsActive() au démarrage. */
export const MODELS = {
  discovery: "perplexity/sonar-pro",
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

/**
 * Pondération de scores.opportunity (0-100) à partir des 4 sous-scores (0-10).
 * franceFit + competitionGap (axes produit/marché) pèsent plus lourd que
 * margin + buildability (facilitateurs d'exécution). Somme = 1.0.
 */
export const SCORE_WEIGHTS = {
  franceFit: 0.3,
  competitionGap: 0.3,
  margin: 0.2,
  buildability: 0.2,
} as const;

/** Paramètres de run par défaut. */
export const DEFAULT_COUNT = 3;
/** Facteur d'over-fetch Sonar pour absorber exclusion + filtre + Zod. */
export const OVERFETCH_FACTOR = 4;
export const OVERFETCH_MIN = 12;
/** Nombre maximum de rounds Sonar avant d'écrire ce qu'on a. */
export const MAX_DISCOVERY_ROUNDS = 2;
