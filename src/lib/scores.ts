export type ScoreColorVariant = "success" | "primary" | "muted";

/** Normalise un score sur 10 pour appliquer les seuils communs. */
function toScale10(value: number, max: number): number {
  return max === 10 ? value : (value / max) * 10;
}

/**
 * Couleur sémantique d'un sous-score (échelle /10).
 * ≥8 success, ≥6.5 primary, sinon muted.
 */
export function scoreColor(value: number, max: number): ScoreColorVariant {
  const scaled = toScale10(value, max);
  if (scaled >= 8) return "success";
  if (scaled >= 6.5) return "primary";
  return "muted";
}

export const scoreColorClass: Record<ScoreColorVariant, string> = {
  success: "text-success",
  primary: "text-primary",
  muted: "text-muted-foreground",
};

export const scoreStrokeClass: Record<ScoreColorVariant, string> = {
  success: "stroke-success",
  primary: "stroke-primary",
  muted: "stroke-muted-foreground",
};

/** Convertit un score (ex. /10) en note entière sur 5 pour affichage étoiles. */
export function scoreToFive(value: number, max: number): number {
  return Math.min(5, Math.max(0, Math.round((value / max) * 5)));
}

/** Clés des 4 sous-scores affichés sur les cartes catalogue. */
export type SubScoreKey = "franceFit" | "buildability" | "margin" | "competitionGap";

export const SUB_SCORE_KEYS: SubScoreKey[] = [
  "franceFit",
  "buildability",
  "margin",
  "competitionGap",
];

export const SCORE_AXIS_SHORT_LABELS: Record<SubScoreKey, string> = {
  franceFit: "Adapté France",
  buildability: "Facile à créer",
  margin: "Rentabilité",
  competitionGap: "Espace marché",
};
