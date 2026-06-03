/** Palette carte (SVG inline) — variantes clair / sombre. */
/** Bleu acier — graphiques Recharts (SVG inline). */
export const CHART_PRIMARY = "#4a6f9a";

export type MapPalette = {
  ocean: string;
  land: string;
  stroke: string;
  hover: string;
  selected: string;
  dormant: string;
};

export const MAP_COLORS_DARK: MapPalette = {
  ocean: "#0c0c0e",
  land: "#161618",
  stroke: "#2a2a2e",
  hover: "#7a9ec4",
  selected: "#4a6f9a",
  dormant: "#161618",
};

export const MAP_COLORS_LIGHT: MapPalette = {
  ocean: "#f4f5f7",
  land: "#e4e7ec",
  stroke: "#c5cad3",
  hover: "#5a7fa8",
  selected: "#4a6f9a",
  dormant: "#dde1e8",
};

/** @deprecated Utiliser getMapColors(isDark) */
export const MAP_COLORS = MAP_COLORS_DARK;

export function getMapColors(isDark: boolean): MapPalette {
  return isDark ? MAP_COLORS_DARK : MAP_COLORS_LIGHT;
}

export function getHeatColor(score: number, isDark = true): string {
  const land = getMapColors(isDark).land;
  if (isDark) {
    if (score >= 90) return "#5a7fa8";
    if (score >= 75) return "#4a6f9a";
    if (score >= 60) return "#3d5f7f";
    if (score >= 45) return "#2f4a63";
    if (score >= 28) return "#243a4f";
    return land;
  }
  if (score >= 90) return "#3d6a9a";
  if (score >= 75) return "#4a7aab";
  if (score >= 60) return "#5a8fbe";
  if (score >= 45) return "#6fa3cf";
  if (score >= 28) return "#8ab8d9";
  return land;
}

/** Variante légèrement plus lisible — hero / arrière-plan (entre défaut et plein éclat). */
export function getHeatColorAmbient(score: number, isDark = true): string {
  if (isDark) {
    if (score >= 90) return "#7094be";
    if (score >= 75) return "#6088b0";
    if (score >= 60) return "#507a9f";
    if (score >= 45) return "#416a88";
    if (score >= 28) return "#355e76";
    return "#2a4a64";
  }
  if (score >= 90) return "#6a94be";
  if (score >= 75) return "#7aa3c8";
  if (score >= 60) return "#8ab0d4";
  if (score >= 45) return "#9abddc";
  if (score >= 28) return "#aac9e4";
  return "#b8d4eb";
}

export function getHeatLegend(isDark = true): string[] {
  return [0, 28, 45, 60, 75, 90].map((s) => getHeatColor(s || 1, isDark));
}

/** @deprecated Utiliser getHeatLegend(isDark) */
export const HEAT_LEGEND = getHeatLegend(true);
