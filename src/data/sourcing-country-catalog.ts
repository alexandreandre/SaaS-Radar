import { flagFromAlpha2, getAllCountryCodes, getCountryNameFr } from "@/lib/country-code";

export type SourcingCountryOption = {
  code: string;
  name: string;
  flag: string;
};

let cached: SourcingCountryOption[] | null = null;

/** Catalogue ISO2 complet — ne dépend pas de Supabase (utilisable côté client). */
export function getSourcingCountryCatalog(): SourcingCountryOption[] {
  if (cached) return cached;
  cached = getAllCountryCodes()
    .map((code) => ({
      code,
      name: getCountryNameFr(code),
      flag: flagFromAlpha2(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return cached;
}
