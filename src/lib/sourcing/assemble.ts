import { randomUUID } from "crypto";
import { resolveSignalKind, sortTractionSignals } from "../traction-signals";
import type { Opportunity } from "@/types/opportunity";
import { CANONICAL_CAC, CANONICAL_STACK } from "./constants";
import { normalizeAcquisitionTabs } from "@/lib/acquisition-channels";
import type { AnalyticalData, FactualLead } from "./schema";
import { normalizeWhyItWorks } from "@/types/opportunity";
import { detectCountryMismatch } from "./traction-quality";
import {
  buildOpportunityScores,
  type ScoreFactsContext,
} from "@/lib/scoring/compute";

export {
  computeFactsScore,
  computeGeminiWeightedScore,
  computeHybridOpportunityScore,
  type ScoreFactsContext,
} from "@/lib/scoring/compute";

/** @deprecated Utiliser computeGeminiWeightedScore — alias rétrocompat tests. */
export { computeGeminiWeightedScore as computeOpportunityScore } from "@/lib/scoring/compute";

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
 * Slug de base robuste : tente le nom, puis l'inspiration étrangère, sinon
 * un fallback déterministe. Garantit une chaîne kebab-case non vide
 * (sinon opportunityRawSchema rejette la fiche sans correction possible par Gemini).
 */
export function safeBaseSlug(lead: Pick<FactualLead, "name" | "foreignInspiration">): string {
  const fromName = slugify(lead.name);
  if (fromName) return fromName;
  const fromInspiration = slugify(lead.foreignInspiration);
  if (fromInspiration) return fromInspiration;
  return `saas-${randomUUID().slice(0, 8)}`;
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

type FactualTractionSignal = FactualLead["tractionSignals"][number];

function dedupeTractionSignals(signals: FactualTractionSignal[]): FactualTractionSignal[] {
  const seen = new Set<string>();
  const out: FactualTractionSignal[] = [];
  for (const signal of signals) {
    const key = `${signal.label}|${signal.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...signal,
      kind: signal.kind ?? resolveSignalKind(signal),
    });
  }
  return out;
}

function parseProductName(foreignInspiration: string, fallbackName: string): string {
  const beforeParen = foreignInspiration.split("(")[0]?.split("—")[0]?.trim();
  return beforeParen || fallbackName;
}

function parseInspirationSummary(foreignInspiration: string, pitch: string): string {
  const dashParts = foreignInspiration.split("—");
  if (dashParts.length > 1) {
    return dashParts.slice(1).join("—").trim() || pitch;
  }
  return pitch;
}

/** Normalise pays, kind et signaux avant assemblage / persistance. */
export function normalizeLead(lead: FactualLead): FactualLead {
  const productName = parseProductName(lead.foreignInspiration, lead.name);
  const summary = parseInspirationSummary(lead.foreignInspiration, lead.pitch);
  const foreignInspiration = detectCountryMismatch(lead)
    ? `${productName} (${lead.originCountry}) — ${summary}`
    : lead.foreignInspiration;

  return {
    ...lead,
    foreignInspiration,
    tractionSignals: sortTractionSignals(dedupeTractionSignals(lead.tractionSignals)),
  };
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
  facts?: ScoreFactsContext;
}

/**
 * Lit le seuil de score plancher depuis SOURCING_MIN_SCORE (0-100).
 * Retourne 0 (garde-fou désactivé) si absent/invalide.
 */
export function getMinScore(): number {
  const raw = process.env.SOURCING_MIN_SCORE;
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, 100);
}

/**
 * Garde-fou qualité (publication directe — pas d'état draft) : une fiche dont
 * scores.opportunity est sous le seuil est rejetée avant upsert (skip + log).
 */
export function meetsScoreGate(opportunity: Opportunity, minScore: number): boolean {
  return opportunity.scores.opportunity >= minScore;
}

/**
 * Rejette un MRR optimiste > 3× la moyenne marché sans signal traction fort.
 */
export function checkMrrSanity(
  opportunity: Opportunity,
  avgTopMrrUsd?: number | null
): string | null {
  if (!avgTopMrrUsd || avgTopMrrUsd <= 0) return null;
  const marketEur = Math.round(avgTopMrrUsd * 0.92);
  if (opportunity.revenueMax <= marketEur * 3) return null;

  const strongTraction = opportunity.tractionSignals.some((s) =>
    /MRR|ARR|revenue|chiffre|clients payants/i.test(`${s.label} ${s.value}`)
  );
  if (strongTraction) return null;

  return `MRR max ${opportunity.revenueMax}€ > 3× moyenne marché (~${marketEur}€) sans signal traction fort`;
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

  const slug = resolveSlug(safeBaseSlug(lead), ctx.dbSlugs, ctx.batchSlugs);

  const factsCtx: ScoreFactsContext = ctx.facts ?? {
    sourceVerified: false,
    tractionCount: lead.tractionSignals.length,
    techComplexity: analytical.techComplexity,
    franceCompetition: analytical.franceCompetition,
    countryMismatch: detectCountryMismatch(lead),
  };

  const { scores } = buildOpportunityScores({
    rawSubScores: analytical.subScores,
    subScoreRationales: analytical.subScoreRationales,
    coherence: {
      subScores: analytical.subScores,
      franceCompetition: analytical.franceCompetition,
      buildableUnder30Days: analytical.buildableUnder30Days,
      techComplexity: analytical.techComplexity,
      problemExists: analytical.franceFitCriteria.problemExists,
      prudentMrr: Math.round(prudent.mrr),
      optimisteMrr: Math.round(optimiste.mrr),
    },
    facts: factsCtx,
  });

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
    scores,
    franceFitCriteria: analytical.franceFitCriteria,
    tractionSignals: sortTractionSignals(lead.tractionSignals),
    whyItWorks: normalizeWhyItWorks(analytical.whyItWorks),
    franceAnalysis: analytical.franceAnalysis,
    financialScenarios,
    cacChannels: CANONICAL_CAC,
    mvpPlan: {
      features: analytical.mvpPlan.features,
      notYet: analytical.mvpPlan.notYet,
      stack: mergeStack(analytical.mvpPlan.stackExtras),
      roadmap: analytical.mvpPlan.roadmap,
      ...(analytical.mvpPlan.stackGuide ? { stackGuide: analytical.mvpPlan.stackGuide } : {}),
      ...(analytical.mvpPlan.pitfalls ? { pitfalls: analytical.mvpPlan.pitfalls } : {}),
      ...(analytical.mvpPlan.launchChecklist
        ? { launchChecklist: analytical.mvpPlan.launchChecklist }
        : {}),
    },
    claudePrompt: analytical.claudePrompt,
    ...(analytical.buildPrompts ? { buildPrompts: analytical.buildPrompts } : {}),
    acquisition: normalizeAcquisitionTabs(analytical.acquisition),
    entrepreneursBuilding: analytical.entrepreneursBuilding,
    foreignInspiration: lead.foreignInspiration,
    url: lead.url,
    foreignMarketProfile: analytical.foreignMarketProfile
      ? {
          ...analytical.foreignMarketProfile,
          country: lead.originCountry,
          flag: lead.originFlag,
        }
      : undefined,
    createdAt: new Date().toISOString(),
    // Champs enrichis (optionnels) : inclus si Gemini les a produits.
    // Sinon laissés undefined → enrichOpportunity() fournit le fallback au runtime.
    ...(analytical.frenchCompetitors ? { frenchCompetitors: analytical.frenchCompetitors } : {}),
    ...(analytical.launchTimeline ? { launchTimeline: analytical.launchTimeline } : {}),
    ...(analytical.emailTemplates ? { emailTemplates: analytical.emailTemplates } : {}),
  };
}
