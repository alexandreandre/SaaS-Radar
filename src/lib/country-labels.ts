/** Préposition française + nom de pays pour titres du type « Le SaaS au Canada ». */
const COUNTRY_PREP_BY_CODE: Record<string, string> = {
  US: "aux États-Unis",
  CA: "au Canada",
  GB: "au Royaume-Uni",
  AU: "en Australie",
  DE: "en Allemagne",
  FR: "en France",
  NL: "aux Pays-Bas",
  BE: "en Belgique",
  CH: "en Suisse",
  SE: "en Suède",
  NO: "en Norvège",
  DK: "au Danemark",
  IE: "en Irlande",
  NZ: "en Nouvelle-Zélande",
  IN: "en Inde",
  JP: "au Japon",
  CN: "en Chine",
  KR: "en Corée du Sud",
  BR: "au Brésil",
  MX: "au Mexique",
  ES: "en Espagne",
  IT: "en Italie",
  PT: "au Portugal",
  IL: "en Israël",
  SG: "à Singapour",
  HK: "à Hong Kong",
  AE: "aux Émirats arabes unis",
  PL: "en Pologne",
  AT: "en Autriche",
  FI: "en Finlande",
};

function inferPrepositionFromName(country: string): string {
  const normalized = country.trim().toLowerCase();
  if (normalized.includes("états-unis") || normalized === "usa") return "aux États-Unis";
  if (normalized.startsWith("les ") || normalized.includes("émirats")) return `aux ${country}`;
  if (/^[aeiouéèêëàâïîôùûühy]/i.test(country)) return `en ${country}`;
  return `au ${country}`;
}

/** Ex. « au Canada », « aux États-Unis », « en Australie » */
export function countryPrepositionPhrase(country: string, countryCode?: string): string {
  const code = countryCode?.toUpperCase();
  if (code && COUNTRY_PREP_BY_CODE[code]) {
    return COUNTRY_PREP_BY_CODE[code];
  }
  return inferPrepositionFromName(country);
}

/** Ex. « Le SaaS au Canada » */
export function formatSaasOriginTitle(country: string, countryCode?: string): string {
  return `Le SaaS ${countryPrepositionPhrase(country, countryCode)}`;
}
