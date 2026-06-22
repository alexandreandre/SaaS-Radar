/**
 * Tests unitaires du module scoring (rubrique, cohérence, hybride).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { applyScoreCoherence, hasMajorCoherenceAdjustment } from "../src/lib/scoring/coherence";
import {
  buildOpportunityScores,
  computeFactsScore,
  computeHybridOpportunityScore,
} from "../src/lib/scoring/compute";
import {
  SCORE_AXIS_LABELS,
  SCORE_AXIS_TOOLTIPS,
  SCORE_GLOBAL_TOOLTIP,
  SCORE_WEIGHTS,
} from "../src/lib/scoring/rubric";
import { scoreOpportunityForProfile } from "../src/lib/scoring/personal-match";
import type { Opportunity } from "../src/types/opportunity";

const baseSub = {
  franceFit: 8,
  buildability: 8,
  margin: 8,
  competitionGap: 8,
};

test("SCORE_WEIGHTS somme à 1", () => {
  const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 0.001);
});

test("rubrique : libellés et tooltips stables", () => {
  assert.equal(SCORE_AXIS_LABELS.competitionGap, "Espace marché");
  assert.equal(SCORE_AXIS_LABELS.franceFit, "Adapté France");
  assert.match(SCORE_GLOBAL_TOOLTIP, /fiabilité des sources/);
  assert.match(SCORE_AXIS_TOOLTIPS.competitionGap, /favorable/);
});

test("applyScoreCoherence plafonne competitionGap si franceCompetition=high", () => {
  const { subScores, adjustments } = applyScoreCoherence({
    subScores: { ...baseSub, competitionGap: 9 },
    franceCompetition: "high",
    buildableUnder30Days: true,
    techComplexity: "low",
    problemExists: true,
    prudentMrr: 1000,
    optimisteMrr: 5000,
  });
  assert.ok(subScores.competitionGap <= 5);
  assert.ok(adjustments.length > 0);
});

test("applyScoreCoherence plafonne buildability si non buildable 30j", () => {
  const { subScores } = applyScoreCoherence({
    subScores: { ...baseSub, buildability: 9 },
    franceCompetition: "low",
    buildableUnder30Days: false,
    techComplexity: "medium",
    problemExists: true,
    prudentMrr: 1000,
    optimisteMrr: 5000,
  });
  assert.ok(subScores.buildability <= 6);
});

test("computeHybridOpportunityScore : faits faibles abaissent le global", () => {
  const sub = baseSub;
  const strongFacts = computeHybridOpportunityScore(sub, {
    sourceVerified: true,
    factConfidence: "high",
    tractionCount: 4,
    tractionCategoriesCovered: 3,
    verificationLevel: "full",
    validUrlCount: 3,
    invalidUrlCount: 0,
    techComplexity: "low",
    franceCompetition: "low",
  });
  const weakFacts = computeHybridOpportunityScore(sub, {
    sourceVerified: false,
    tractionCount: 0,
    verificationLevel: "none",
    validUrlCount: 0,
    invalidUrlCount: 2,
    countryMismatch: true,
    techComplexity: "high",
    franceCompetition: "high",
  });
  assert.ok(strongFacts > weakFacts);
});

test("buildOpportunityScores persiste _meta avec décomposition hybride", () => {
  const { scores, meta } = buildOpportunityScores({
    rawSubScores: baseSub,
    subScoreRationales: {
      franceFit: "Test",
      buildability: "Test",
      margin: "Test",
      competitionGap: "Test",
    },
    coherence: {
      subScores: baseSub,
      franceCompetition: "low",
      buildableUnder30Days: true,
      techComplexity: "low",
      problemExists: true,
      prudentMrr: 980,
      optimisteMrr: 7900,
    },
    facts: {
      sourceVerified: true,
      factConfidence: "high",
      tractionCount: 2,
      techComplexity: "low",
      franceCompetition: "low",
    },
  });
  assert.equal(scores.opportunity, meta.opportunity);
  assert.ok(scores._meta?.geminiWeighted != null);
  assert.ok(scores._meta?.factsScore != null);
  assert.deepEqual(scores._meta?.subScoreRationales?.franceFit, "Test");
});

test("hasMajorCoherenceAdjustment détecte correction > 1.5 pt", () => {
  assert.equal(
    hasMajorCoherenceAdjustment(["competitionGap: 9 → 5 (franceCompetition=high)"]),
    true
  );
  assert.equal(hasMajorCoherenceAdjustment(["competitionGap: 8 → 7 (franceCompetition=medium)"]), false);
});

test("scoreOpportunityForProfile favorise le secteur choisi", () => {
  const opp = {
    scores: { opportunity: 70, franceFit: 7, buildability: 7, margin: 7, competitionGap: 7 },
    sector: "healthcare",
    techComplexity: "low",
    buildableUnder30Days: true,
    revenueMin: 3000,
    lowCompetition: true,
    boringBusiness: false,
  } as Opportunity;
  const withSector = scoreOpportunityForProfile(opp, { sector: "health", tech: "none", time: "low", goal: "quick", situation: "cdi", experience: "never" });
  const without = scoreOpportunityForProfile(opp, { sector: "any", tech: "none", time: "low", goal: "quick", situation: "cdi", experience: "never" });
  assert.ok(withSector > without);
});

test("computeFactsScore pénalise URLs invalides", () => {
  const good = computeFactsScore({
    sourceVerified: true,
    tractionCount: 2,
    validUrlCount: 2,
    invalidUrlCount: 0,
    verificationLevel: "full",
  });
  const bad = computeFactsScore({
    sourceVerified: false,
    tractionCount: 1,
    validUrlCount: 0,
    invalidUrlCount: 3,
    verificationLevel: "none",
  });
  assert.ok(good > bad);
});
