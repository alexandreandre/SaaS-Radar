import { randomUUID } from "crypto";
import type { Opportunity } from "@/types/opportunity";
import { CANONICAL_CAC, CANONICAL_STACK, SCORE_WEIGHTS } from "./constants";
import type { AnalyticalData, FactualLead } from "./schema";

/** Normalise un nom en slug kebab-case. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Résout le slug final selon les 2 cas de collision :
 * - collision avec un slug DÉJÀ EN DB : on garde le slug tel quel (upsert idempotent).
 * - collision INTRA-BATCH : produit distinct → on suffixe -2, -3, ...
 */
export function resolveSlug(
  base: string,
  dbSlugs: Set<string>,
  batchSlugs: Set<string>
): string {
  if (batchSlugs.has(base)) {
    let i = 2;
    while (batchSlugs.has(`${base}-${i}`) || dbSlugs.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }
  // Si seulement en DB (ou nouveau) : on garde le base → l'upsert onConflict gère l'update.
  return base;
}

/** Calcule scores.opportunity (0-100) par moyenne pondérée déterministe des 4 sous-scores. */
export function computeOpportunityScore(sub: AnalyticalData["subScores"]): number {
  const weighted =
    sub.franceFit * SCORE_WEIGHTS.franceFit +
    sub.competitionGap * SCORE_WEIGHTS.competitionGap +
    sub.margin * SCORE_WEIGHTS.margin +
    sub.buildability * SCORE_WEIGHTS.buildability;
  return Math.round(weighted * 10);
}

/** Fusionne la stack canonique (mappable) avec les extras de Gemini, sans doublon. */
function mergeStack(extras: string[]): string[] {
  const out: string[] = [...CANONICAL_STACK];
  for (const e of extras) {
    if (!out.some((s) => s.toLowerCase() === e.toLowerCase())) out.push(e);
  }
  return out;
}

interface AssembleContext {
  dbSlugs: Set<string>;
  batchSlugs: Set<string>;
}

/**
 * Étape C — fusionne faits (Sonar) + analyse (Gemini) + champs CALCULÉS par le code
 * en une fiche Opportunity raw. Les cohérences critiques sont garanties ici.
 */
export function assembleOpportunity(
  lead: FactualLead,
  analytical: AnalyticalData,
  ctx: AssembleContext
): Opportunity {
  // mrr recalculé par le code (jamais issu de Gemini).
  const financialScenarios = analytical.financialScenarios.map((s) => ({
    ...s,
    mrr: Math.round(s.clients * s.avgPrice),
  }));

  const prudent =
    financialScenarios.find((s) => s.name === "Prudent") ?? financialScenarios[0];
  const optimiste =
    financialScenarios.find((s) => s.name === "Optimiste") ??
    financialScenarios[financialScenarios.length - 1];

  const slug = resolveSlug(slugify(lead.name), ctx.dbSlugs, ctx.batchSlugs);

  return {
    id: randomUUID(),
    slug,
    name: lead.name,
    pitch: lead.pitch,
    originCountry: lead.originCountry,
    originCountryCode: lead.originCountryCode.toUpperCase(),
    originFlag: lead.originFlag,
    sector: lead.sector,
    targetClient: lead.targetClient,
    clientType: analytical.clientType,
    techComplexity: analytical.techComplexity,
    franceCompetition: analytical.franceCompetition,
    revenueMin: Math.round(prudent.mrr),
    revenueMax: Math.round(optimiste.mrr),
    buildableUnder30Days: analytical.buildableUnder30Days,
    boringBusiness: analytical.boringBusiness,
    aiPowered: analytical.aiPowered,
    lowCompetition:
      analytical.franceCompetition === "none" || analytical.franceCompetition === "low",
    scores: {
      opportunity: computeOpportunityScore(analytical.subScores),
      ...analytical.subScores,
    },
    franceFitCriteria: analytical.franceFitCriteria,
    tractionSignals: lead.tractionSignals,
    whyItWorks: analytical.whyItWorks,
    franceAnalysis: analytical.franceAnalysis,
    financialScenarios,
    cacChannels: CANONICAL_CAC,
    mvpPlan: {
      features: analytical.mvpPlan.features,
      notYet: analytical.mvpPlan.notYet,
      stack: mergeStack(analytical.mvpPlan.stackExtras),
      roadmap: analytical.mvpPlan.roadmap,
    },
    claudePrompt: analytical.claudePrompt,
    acquisition: analytical.acquisition,
    entrepreneursBuilding: analytical.entrepreneursBuilding,
    foreignInspiration: lead.foreignInspiration,
    url: lead.url,
    foreignMarketProfile: analytical.foreignMarketProfile,
    createdAt: new Date().toISOString(),
  };
}
