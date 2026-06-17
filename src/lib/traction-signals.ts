import type { Opportunity, TractionSignal } from "@/types/opportunity";

const SIGNAL_CATEGORY_ORDER: RegExp[] = [
  /mrr|revenu|arr|revenue|chiffre|pricing|prix/i,
  /backlink|seo|autorité|authority|recommand|blog|presse|visibilit|cabinet/i,
  /reddit|mention|communauté|community|avis|app store|review|indie hack|bouche/i,
];

const NARRATIVE_VALUE_PATTERN =
  /recommand|reconnaît|utilise|perce|cabinet|blog|conseil|recommande|témoignage/i;

const METRIC_VALUE_PATTERN = /[\d]/;

const METRIC_SUFFIX_PATTERN = /[kKmM%★€$£]|[\d]{2,}/;

export function isMetricValue(value: string, label?: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.length > 48 && NARRATIVE_VALUE_PATTERN.test(trimmed)) return false;
  if (NARRATIVE_VALUE_PATTERN.test(trimmed) && !/^[$€£]|CAD|AUD/i.test(trimmed)) {
    return false;
  }

  if (label && /recommand|blog|cabinet|presse|témoignage/i.test(label)) {
    return false;
  }

  return METRIC_VALUE_PATTERN.test(trimmed) && METRIC_SUFFIX_PATTERN.test(trimmed);
}

export function resolveSignalKind(signal: TractionSignal): "metric" | "narrative" {
  if (signal.kind) return signal.kind;
  return isMetricValue(signal.value, signal.label) ? "metric" : "narrative";
}

function signalCategoryIndex(signal: TractionSignal): number {
  const text = `${signal.label} ${signal.value}`;
  const idx = SIGNAL_CATEGORY_ORDER.findIndex((pattern) => pattern.test(text));
  return idx === -1 ? SIGNAL_CATEGORY_ORDER.length : idx;
}

/** Tri déterministe : MRR → autorité → communauté → autres. */
export function sortTractionSignals<T extends TractionSignal>(signals: T[]): T[] {
  return [...signals].sort((a, b) => {
    const diff = signalCategoryIndex(a) - signalCategoryIndex(b);
    if (diff !== 0) return diff;
    return a.label.localeCompare(b.label, "fr");
  });
}

export const CHIFFRES_ROW_CATEGORIES = [
  {
    title: "Revenu mensuel (MRR)",
    subtitle: "Ce qu'ils encaissent chaque mois",
    metricColor: "text-green-400",
  },
  {
    title: "Autorité et visibilité en ligne",
    subtitle: "Preuve de crédibilité sur le marché d'origine",
    metricColor: "text-blue-400",
  },
  {
    title: "Communauté et bouche-à-oreille",
    subtitle: "Signaux d'adoption et d'intérêt early-adopters",
    metricColor: "text-purple-400",
  },
] as const;

export {
  slotSignalsByCategory,
  type SlottedTractionSignals,
  type TractionCategory,
} from "@/lib/sourcing/traction-quality";

/** Signaux disponibles pour le point 02, avec fallback highlights si besoin. */
export function resolveChiffresSignals(opportunity: Opportunity): TractionSignal[] {
  const primary = sortTractionSignals(opportunity.tractionSignals);
  if (primary.length >= 3) return primary;

  const highlights = opportunity.foreignMarketProfile?.tractionHighlights ?? [];
  const seen = new Set(primary.map((s) => `${s.label}|${s.value}`));
  const merged = [...primary];

  for (const signal of sortTractionSignals(highlights)) {
    const key = `${signal.label}|${signal.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(signal);
    if (merged.length >= 3) break;
  }

  return merged;
}
