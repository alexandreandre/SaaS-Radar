/** Palette carte (SVG inline) — alignée sur les tokens radar, pas de bleu SaaS criard. */
/** Bleu acier — graphiques Recharts (SVG inline). */
export const CHART_PRIMARY = "#4a6f9a";

export const MAP_COLORS = {
  ocean: "#0c0c0e",
  land: "#161618",
  stroke: "#2a2a2e",
  hover: "#7a9ec4",
  selected: "#4a6f9a",
  dormant: "#161618",
} as const;

export function getHeatColor(score: number): string {
  if (score >= 90) return "#5a7fa8";
  if (score >= 75) return "#4a6f9a";
  if (score >= 60) return "#3d5f7f";
  if (score >= 45) return "#2f4a63";
  if (score >= 28) return "#243a4f";
  return MAP_COLORS.land;
}

/** Variante légèrement plus lisible — hero / arrière-plan (entre défaut et plein éclat). */
export function getHeatColorAmbient(score: number): string {
  if (score >= 90) return "#7094be";
  if (score >= 75) return "#6088b0";
  if (score >= 60) return "#507a9f";
  if (score >= 45) return "#416a88";
  if (score >= 28) return "#355e76";
  return "#2a4a64";
}

/** Échelle légende carte (veille → brûlant). */
export const HEAT_LEGEND = [0, 28, 45, 60, 75, 90].map((s) => getHeatColor(s || 1));
