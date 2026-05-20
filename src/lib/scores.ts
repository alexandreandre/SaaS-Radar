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

/** Convertit un score (ex. /10) en note entière sur 5 pour affichage étoiles. */
export function scoreToFive(value: number, max: number): number {
  return Math.min(5, Math.max(0, Math.round((value / max) * 5)));
}
