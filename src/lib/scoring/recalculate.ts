import type { Opportunity } from "@/types/opportunity";
import { buildOpportunityScores, type ScoreFactsContext } from "./compute";

/** Recalcule les scores (cohérence + hybride) à partir d'une fiche existante, sans re-appeler Gemini. */
export function recalculateOpportunityScores(
  opp: Opportunity,
  factsOverrides: Partial<ScoreFactsContext> = {}
): Opportunity["scores"] {
  const rawSubScores = opp.scores._meta?.rawSubScores ?? {
    franceFit: opp.scores.franceFit,
    buildability: opp.scores.buildability,
    margin: opp.scores.margin,
    competitionGap: opp.scores.competitionGap,
  };

  const prudent =
    opp.financialScenarios.find((s) => s.name === "Prudent") ?? opp.financialScenarios[0];
  const optimiste =
    opp.financialScenarios.find((s) => s.name === "Optimiste") ??
    opp.financialScenarios[opp.financialScenarios.length - 1];

  const facts: ScoreFactsContext = {
    sourceVerified: false,
    tractionCount: opp.tractionSignals.length,
    techComplexity: opp.techComplexity,
    franceCompetition: opp.franceCompetition,
    ...factsOverrides,
  };

  return buildOpportunityScores({
    rawSubScores,
    subScoreRationales: opp.scores._meta?.subScoreRationales,
    coherence: {
      subScores: rawSubScores,
      franceCompetition: opp.franceCompetition,
      buildableUnder30Days: opp.buildableUnder30Days,
      techComplexity: opp.techComplexity,
      problemExists: opp.franceFitCriteria.problemExists,
      prudentMrr: prudent?.mrr ?? opp.revenueMin,
      optimisteMrr: optimiste?.mrr ?? opp.revenueMax,
    },
    facts,
  }).scores;
}
