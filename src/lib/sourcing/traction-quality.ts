import type { TractionSignal } from "@/types/opportunity";
import { resolveSignalKind } from "@/lib/traction-signals";
import type { FactualLead } from "./schema";

export type TractionCategory = "mrr" | "authority" | "community";

const CATEGORY_PATTERNS: Record<TractionCategory, RegExp> = {
  mrr: /mrr|revenu|arr|revenue|chiffre|pricing|prix/i,
  authority: /backlink|seo|autorité|authority|recommand|blog|presse|visibilit|cabinet/i,
  community: /reddit|mention|communauté|community|avis|app store|review|indie hack|bouche/i,
};

const ALL_CATEGORIES: TractionCategory[] = ["mrr", "authority", "community"];

export type SlottedTractionSignals = {
  mrr: TractionSignal | null;
  authority: TractionSignal | null;
  community: TractionSignal | null;
  extras: TractionSignal[];
};

export type TractionQualityReport = {
  score: number;
  categories: SlottedTractionSignals;
  missing: TractionCategory[];
  extras: TractionSignal[];
  countryMismatch: boolean;
};

function signalKey(signal: TractionSignal): string {
  return `${signal.label}|${signal.value}`;
}

export function classifySignal(signal: TractionSignal): TractionCategory | "extra" {
  const text = `${signal.label} ${signal.value}`;
  for (const category of ALL_CATEGORIES) {
    if (CATEGORY_PATTERNS[category].test(text)) return category;
  }
  return "extra";
}

export function slotSignalsByCategory(signals: TractionSignal[]): SlottedTractionSignals {
  const slotted: SlottedTractionSignals = {
    mrr: null,
    authority: null,
    community: null,
    extras: [],
  };

  for (const signal of signals) {
    const category = classifySignal(signal);
    if (category === "extra") {
      slotted.extras.push(signal);
      continue;
    }
    if (!slotted[category]) {
      slotted[category] = signal;
    } else {
      slotted.extras.push(signal);
    }
  }

  return slotted;
}

function extractInspirationCountry(foreignInspiration: string): string | null {
  const match = foreignInspiration.match(/\(([^)]+)\)/);
  return match?.[1]?.trim() ?? null;
}

function normalizeCountryToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  "etats-unis": ["us", "usa", "united states", "amerique", "america"],
  "royaume-uni": ["uk", "gb", "united kingdom", "great britain", "angleterre"],
  canada: ["ca", "can"],
  australie: ["au", "australia"],
  allemagne: ["de", "germany"],
};

function countriesMatch(a: string, b: string): boolean {
  const na = normalizeCountryToken(a);
  const nb = normalizeCountryToken(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
    const tokens = [canonical, ...aliases];
    const aHit = tokens.some((t) => na === t || na.includes(t));
    const bHit = tokens.some((t) => nb === t || nb.includes(t));
    if (aHit && bHit) return true;
  }
  return false;
}

export function detectCountryMismatch(lead: Pick<FactualLead, "foreignInspiration" | "originCountry">): boolean {
  const inspirationCountry = extractInspirationCountry(lead.foreignInspiration);
  if (!inspirationCountry) return false;
  return !countriesMatch(inspirationCountry, lead.originCountry);
}

function computeTractionScore(slotted: SlottedTractionSignals): number {
  let score = 0;
  if (slotted.mrr) score += 40;
  if (slotted.authority) score += 30;
  if (slotted.community) score += 20;
  score += Math.min(slotted.extras.length * 5, 10);
  return Math.min(100, score);
}

export function assessTractionQuality(lead: FactualLead): TractionQualityReport {
  const categories = slotSignalsByCategory(lead.tractionSignals);
  const missing = ALL_CATEGORIES.filter((category) => !categories[category]);

  return {
    score: computeTractionScore(categories),
    categories,
    missing,
    extras: categories.extras,
    countryMismatch: detectCountryMismatch(lead),
  };
}

export function countCoveredCategories(report: TractionQualityReport): number {
  return ALL_CATEGORIES.length - report.missing.length;
}

export function needsTractionEnrichment(report: TractionQualityReport): boolean {
  return report.missing.length > 0 || report.countryMismatch;
}
