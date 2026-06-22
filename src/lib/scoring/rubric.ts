import type { SubScoreKey } from "@/lib/scores";

export type { SubScoreKey } from "@/lib/scores";

export type SubScores = Record<SubScoreKey, number>;

export type SubScoreRationales = Record<SubScoreKey, string>;

/**
 * Pondération du score Gemini (0–100) à partir des 4 sous-scores (0–10).
 * franceFit + competitionGap (marché) > margin + buildability (exécution). Somme = 1.
 */
export const SCORE_WEIGHTS: Record<SubScoreKey, number> = {
  franceFit: 0.3,
  competitionGap: 0.3,
  margin: 0.2,
  buildability: 0.2,
};

export const SCORE_AXIS_LABELS: Record<SubScoreKey | "opportunity", string> = {
  opportunity: "Score global",
  franceFit: "Adapté France",
  buildability: "Facile à créer",
  margin: "Rentabilité",
  competitionGap: "Espace marché",
};

export const SCORE_GLOBAL_TOOLTIP =
  "Note Build Road combinant l'analyse marché et la fiabilité des sources.";

export const SCORE_AXIS_TOOLTIPS: Record<SubScoreKey, string> = {
  franceFit:
    "Le problème existe en France, la culture d'achat est compatible et la réglementation ne bloque pas le lancement.",
  buildability:
    "Un solo dev peut livrer le MVP France en ~30 jours avec une stack standard (Next.js, Supabase, Stripe).",
  margin:
    "Potentiel de marge brute et pricing B2B réaliste sur le marché français.",
  competitionGap:
    "Fenêtre ouverte en France — plus la note est haute, plus l'espace concurrentiel est favorable.",
};

/** Grille 0–10 injectée dans le prompt Gemini. */
export const SCORE_RUBRIC_TIERS = [
  "9–10 : signal fort documenté dans les faits du lead (traction, concurrence, pricing).",
  "7–8 : bon potentiel avec quelques réserves mineures.",
  "5–6 : doute ou frein modéré — rester prudent.",
  "3–4 : frein significatif (réglementation, concurrence, scope trop large).",
  "0–2 : blocage majeur ou données insuffisantes.",
] as const;

const AXIS_RUBRIC_LINES: Record<SubScoreKey, string> = {
  franceFit:
    "Adapté France — le problème existe-t-il en FR ? Culture d'achat B2B/B2C compatible ? Réglementation gérable ?",
  buildability:
    "Facile à créer — MVP solo ~30j faisable ? Stack standard suffisante ? Pas une plateforme US trop large à cloner.",
  margin:
    "Rentabilité — marge brute réaliste, pricing FR crédible (29–99€/mois B2B typique), modèle récurrent viable.",
  competitionGap:
    "Espace marché — fenêtre ouverte en France (peu ou pas de SaaS dominant). Score HAUT = espace favorable, pas « peu de concurrents » au sens absolu.",
};

/** Bloc rubrique pour le prompt Gemini (structure.ts). */
export function buildRubricPromptBlock(): string {
  return [
    "RUBRIQUE subScores (0–10, une décimale max) :",
    ...SCORE_RUBRIC_TIERS.map((t) => `  • ${t}`),
    "",
    ...Object.entries(AXIS_RUBRIC_LINES).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "subScoreRationales (OBLIGATOIRE) : une phrase par axe expliquant la note, ancrée dans les faits du lead.",
    "Interdit de mettre un sous-score > 8 sans signal explicite dans tractionSignals ou foreignInspiration.",
    "NE PRODUIS PAS scores.opportunity (calculé par le code).",
  ].join("\n");
}

export { SCORE_AXIS_SHORT_LABELS, SUB_SCORE_KEYS } from "@/lib/scores";
