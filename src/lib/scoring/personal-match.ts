import type { Opportunity, Sector } from "@/types/opportunity";

const QUIZ_SECTOR_MAP: Record<string, Sector[]> = {
  health: ["healthcare"],
  construction: ["construction"],
  finance: ["finance", "legal"],
};

export type QuizAnswers = Record<string, string>;

/** Score interne de matching profil × opportunité (quiz uniquement, non affiché en chiffre). */
export function scoreOpportunityForProfile(opp: Opportunity, answers: QuizAnswers): number {
  let score = opp.scores.opportunity;

  const preferredSectors = QUIZ_SECTOR_MAP[answers.sector];
  if (preferredSectors?.includes(opp.sector)) score += 20;

  if (answers.tech === "none" && opp.techComplexity === "low") score += 12;
  if (answers.tech === "medium" && opp.techComplexity !== "high") score += 6;
  if (answers.tech === "dev") {
    if (opp.techComplexity !== "low") score += 6;
    if (opp.scores.buildability >= 7) score += 4;
  }

  if (opp.buildableUnder30Days) {
    if (answers.time === "low") score += 10;
    if (answers.experience === "never") score += 8;
    if (answers.situation === "cdi" || answers.situation === "student") score += 6;
  }

  if (answers.goal === "quick") {
    if (opp.revenueMin <= 5000) score += 6;
    if (opp.buildableUnder30Days) score += 6;
    if (opp.techComplexity === "low") score += 4;
  }
  if (answers.goal === "scale") {
    score += opp.scores.franceFit;
    if (opp.scores.competitionGap >= 7) score += 5;
  }
  if (answers.goal === "test" && opp.buildableUnder30Days) score += 8;

  if (answers.situation === "fulltime") score += opp.scores.opportunity * 0.05;
  if (answers.experience === "already") score += opp.scores.margin * 0.5;
  if (answers.time === "high" && opp.techComplexity === "high") score += 4;

  if (opp.lowCompetition) score += 4;
  if (opp.boringBusiness) score += 2;

  return score;
}

export function getProfileRecommendation(
  answers: QuizAnswers,
  catalog: Opportunity[]
): Opportunity | null {
  if (catalog.length === 0) return null;
  return [...catalog].sort(
    (a, b) => scoreOpportunityForProfile(b, answers) - scoreOpportunityForProfile(a, answers)
  )[0];
}

export function getProfileMatchReasons(answers: QuizAnswers, opp: Opportunity): string[] {
  const reasons: string[] = [];
  const preferredSectors = QUIZ_SECTOR_MAP[answers.sector];
  if (preferredSectors?.includes(opp.sector)) {
    reasons.push("Correspond à ton secteur d'affinité");
  }
  if (answers.tech === "none" && opp.techComplexity === "low") {
    reasons.push("Faible complexité technique — adapté sans code");
  }
  if (answers.tech === "dev" && opp.scores.buildability >= 7) {
    reasons.push("MVP buildable rapidement avec ta stack");
  }
  if (opp.buildableUnder30Days && (answers.time === "low" || answers.experience === "never")) {
    reasons.push("Lançable en side project (~30 jours)");
  }
  if (answers.goal === "quick" && opp.revenueMin <= 5000) {
    reasons.push("Potentiel de revenus accessibles rapidement");
  }
  if (answers.goal === "scale" && opp.scores.franceFit >= 7) {
    reasons.push("Fort potentiel marché France");
  }
  if (opp.lowCompetition) {
    reasons.push("Peu de concurrence en France");
  }
  return reasons.slice(0, 3);
}
