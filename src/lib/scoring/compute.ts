import type { Scores, ScoreMeta } from "@/types/opportunity";
import { applyScoreCoherence, type CoherenceInput } from "./coherence";
import { SCORE_WEIGHTS, type SubScoreRationales, type SubScores } from "./rubric";

export type ScoreFactsContext = {
  sourceVerified: boolean;
  factConfidence?: "low" | "medium" | "high" | null;
  tractionCount: number;
  tractionCategoriesCovered?: number;
  techComplexity?: string;
  franceCompetition?: string;
  verificationLevel?: "none" | "partial" | "full";
  validUrlCount?: number;
  invalidUrlCount?: number;
  countryMismatch?: boolean;
};

export type BuildScoresInput = {
  rawSubScores: SubScores;
  subScoreRationales?: SubScoreRationales;
  coherence: CoherenceInput;
  facts: ScoreFactsContext;
};

/** Moyenne pondérée des 4 sous-scores → 0–100. */
export function computeGeminiWeightedScore(sub: SubScores): number {
  const weighted =
    sub.franceFit * SCORE_WEIGHTS.franceFit +
    sub.competitionGap * SCORE_WEIGHTS.competitionGap +
    sub.margin * SCORE_WEIGHTS.margin +
    sub.buildability * SCORE_WEIGHTS.buildability;
  return Math.round(weighted * 10);
}

/** Score 0–100 basé sur la qualité des faits vérifiables (pas le LLM). */
export function computeFactsScore(ctx: ScoreFactsContext): number {
  let score = 40;

  if (ctx.sourceVerified) score += 20;
  if (ctx.verificationLevel === "full") score += 8;
  else if (ctx.verificationLevel === "partial") score += 4;

  if (ctx.factConfidence === "high") score += 18;
  else if (ctx.factConfidence === "medium") score += 10;
  else if (ctx.factConfidence === "low") score += 2;

  score += Math.min(ctx.tractionCount * 4, 12);

  if (ctx.tractionCategoriesCovered === 3) score += 10;
  else if (ctx.tractionCategoriesCovered === 2) score += 5;

  if (ctx.validUrlCount != null) {
    const total = ctx.validUrlCount + (ctx.invalidUrlCount ?? 0);
    if (total > 0) {
      const ratio = ctx.validUrlCount / total;
      if (ratio >= 1) score += 6;
      else if (ratio >= 0.5) score += 2;
      else score -= 6;
    }
  }

  if (ctx.countryMismatch) score -= 8;
  if (ctx.techComplexity === "high") score -= 8;
  if (ctx.franceCompetition === "high") score -= 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Score hybride : 60 % analyse pondérée + 40 % faits vérifiables. */
export function computeHybridOpportunityScore(
  sub: SubScores,
  facts: ScoreFactsContext
): number {
  const geminiScore = computeGeminiWeightedScore(sub);
  const factsScore = computeFactsScore(facts);
  return Math.round(0.6 * geminiScore + 0.4 * factsScore);
}

export type ScoreBundle = {
  scores: Scores;
  meta: ScoreMeta;
};

/** Pipeline complet : cohérence → hybride → objet Scores avec _meta. */
export function buildOpportunityScores(input: BuildScoresInput): ScoreBundle {
  const { subScores, adjustments } = applyScoreCoherence(input.coherence);
  const geminiWeighted = computeGeminiWeightedScore(subScores);
  const factsScore = computeFactsScore(input.facts);
  const opportunity = Math.round(0.6 * geminiWeighted + 0.4 * factsScore);

  const meta: ScoreMeta = {
    geminiWeighted,
    factsScore,
    opportunity,
    adjustments,
    rawSubScores: input.rawSubScores,
    ...(input.subScoreRationales ? { subScoreRationales: input.subScoreRationales } : {}),
  };

  return {
    scores: {
      opportunity,
      ...subScores,
      _meta: meta,
    },
    meta,
  };
}

/** Score global seul — pour early exit dans run.ts sans construire tout l'objet. */
export function previewOpportunityScore(input: BuildScoresInput): number {
  return buildOpportunityScores(input).scores.opportunity;
}
