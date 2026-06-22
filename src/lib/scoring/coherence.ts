import type { FranceCompetition, TechComplexity } from "@/types/opportunity";
import type { SubScores } from "./rubric";

export type CoherenceInput = {
  subScores: SubScores;
  franceCompetition: FranceCompetition;
  buildableUnder30Days: boolean;
  techComplexity: TechComplexity;
  problemExists: boolean;
  prudentMrr: number;
  optimisteMrr: number;
};

export type CoherenceResult = {
  subScores: SubScores;
  adjustments: string[];
};

function clampSubScore(value: number): number {
  return Math.round(Math.max(0, Math.min(10, value)) * 10) / 10;
}

function cap(
  subScores: SubScores,
  key: keyof SubScores,
  max: number,
  reason: string,
  adjustments: string[]
): SubScores {
  if (subScores[key] <= max) return subScores;
  adjustments.push(`${key}: ${subScores[key]} → ${max} (${reason})`);
  return { ...subScores, [key]: max };
}

function floor(
  subScores: SubScores,
  key: keyof SubScores,
  min: number,
  reason: string,
  adjustments: string[]
): SubScores {
  if (subScores[key] >= min) return subScores;
  adjustments.push(`${key}: ${subScores[key]} → ${min} (${reason})`);
  return { ...subScores, [key]: min };
}

/**
 * Corrige les sous-scores LLM pour respecter les signaux structurants déjà validés.
 * Ne rejette pas la fiche — documente les ajustements dans score_meta.adjustments.
 */
export function applyScoreCoherence(input: CoherenceInput): CoherenceResult {
  const adjustments: string[] = [];
  let subScores: SubScores = { ...input.subScores };

  if (input.franceCompetition === "high") {
    subScores = cap(subScores, "competitionGap", 5, "franceCompetition=high", adjustments);
  } else if (input.franceCompetition === "medium") {
    subScores = cap(subScores, "competitionGap", 7, "franceCompetition=medium", adjustments);
  } else if (input.franceCompetition === "none") {
    subScores = floor(subScores, "competitionGap", 7, "franceCompetition=none", adjustments);
  }

  if (!input.buildableUnder30Days) {
    subScores = cap(subScores, "buildability", 6, "buildableUnder30Days=false", adjustments);
  }

  if (input.techComplexity === "high") {
    subScores = cap(subScores, "buildability", 5, "techComplexity=high", adjustments);
  } else if (input.techComplexity === "medium") {
    subScores = cap(subScores, "buildability", 8, "techComplexity=medium", adjustments);
  }

  if (!input.problemExists) {
    subScores = cap(subScores, "franceFit", 4, "problemExists=false", adjustments);
  }

  if (input.prudentMrr > 0 && input.optimisteMrr / input.prudentMrr > 10) {
    subScores = cap(subScores, "margin", 7, "ratio optimiste/prudent > 10×", adjustments);
  }

  subScores = Object.fromEntries(
    Object.entries(subScores).map(([k, v]) => [k, clampSubScore(v as number)])
  ) as SubScores;

  return { subScores, adjustments };
}

/** Alerte admin si une correction dépasse 1.5 pt sur un axe. */
export function hasMajorCoherenceAdjustment(adjustments: string[]): boolean {
  return adjustments.some((line) => {
    const match = line.match(/:\s*([\d.]+)\s*→\s*([\d.]+)/);
    if (!match) return false;
    const before = Number.parseFloat(match[1]);
    const after = Number.parseFloat(match[2]);
    return Math.abs(before - after) > 1.5;
  });
}
