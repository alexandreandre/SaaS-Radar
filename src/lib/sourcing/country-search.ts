import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import fr from "i18n-iso-countries/langs/fr.json";
import { flagFromAlpha2 } from "@/lib/country-code";

countries.registerLocale(en);
countries.registerLocale(fr);

export type SearchableCountry = {
  code: string;
  name: string;
  flag: string;
  nameEn: string;
  nameFr: string;
};

/** Alias courants FR/EN → code ISO2 */
const ALIASES: Record<string, string[]> = {
  FR: ["france", "fr"],
  US: ["usa", "u.s.", "etats-unis", "états-unis", "united states", "amerique", "amérique"],
  GB: ["uk", "u.k.", "royaume-uni", "angleterre", "england", "britain", "great britain"],
  DE: ["allemagne", "germany", "deutschland"],
  CA: ["canada"],
  AU: ["australie", "australia"],
  NL: ["pays-bas", "hollande", "netherlands"],
  BE: ["belgique", "belgium"],
  CH: ["suisse", "switzerland"],
  ES: ["espagne", "spain"],
  IT: ["italie", "italy"],
  PT: ["portugal"],
  IE: ["irlande", "ireland"],
  SE: ["suède", "suede", "sweden"],
  NO: ["norvège", "norvege", "norway"],
  DK: ["danemark", "denmark"],
  FI: ["finlande", "finland"],
  PL: ["pologne", "poland"],
  JP: ["japon", "japan"],
  CN: ["chine", "china"],
  IN: ["inde", "india"],
  BR: ["bresil", "brésil", "brazil"],
  MX: ["mexique", "mexico"],
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function enrichCountry(code: string, displayName?: string): SearchableCountry {
  const upper = code.toUpperCase();
  const nameFr = countries.getName(upper, "fr") ?? displayName ?? upper;
  const nameEn = countries.getName(upper, "en") ?? displayName ?? upper;
  return {
    code: upper,
    name: displayName ?? nameFr,
    flag: flagFromAlpha2(upper),
    nameEn,
    nameFr,
  };
}

export function buildSearchableCountries(
  markets: Array<{ code: string; name: string; flag: string }>
): SearchableCountry[] {
  return markets.map((m) => ({
    ...enrichCountry(m.code, m.name),
    flag: m.flag || flagFromAlpha2(m.code),
  }));
}

export function matchesCountryQuery(country: SearchableCountry, rawQuery: string): boolean {
  const q = normalize(rawQuery);
  if (!q) return false;

  const haystacks = [
    country.code,
    country.name,
    country.nameEn,
    country.nameFr,
    ...(ALIASES[country.code] ?? []),
  ];

  return haystacks.some((h) => normalize(h).includes(q));
}

/** Pays prioritaires affichés quand le champ est vide (focus sans saisie). */
export const PRIORITY_COUNTRY_CODES = ["US", "GB", "CA", "DE", "AU", "FR", "NL", "SE", "SG", "CH"];

export function priorityCountries(all: SearchableCountry[]): SearchableCountry[] {
  const byCode = new Map(all.map((c) => [c.code, c]));
  const picked: SearchableCountry[] = [];
  for (const code of PRIORITY_COUNTRY_CODES) {
    const c = byCode.get(code);
    if (c) picked.push(c);
  }
  return picked;
}
