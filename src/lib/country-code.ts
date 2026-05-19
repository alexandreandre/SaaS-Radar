import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import fr from "i18n-iso-countries/langs/fr.json";

countries.registerLocale(en);
countries.registerLocale(fr);

/** Noms TopoJSON world-atlas qui ne matchent pas i18n */
const NAME_TO_ALPHA2: Record<string, string> = {
  "United States of America": "US",
  "Dem. Rep. Congo": "CD",
  "Dominican Rep.": "DO",
  "W. Sahara": "EH",
  "Fr. S. Antarctic Lands": "TF",
  "Falkland Is.": "FK",
  "Côte d'Ivoire": "CI",
  "Czechia": "CZ",
  "eSwatini": "SZ",
  "Bosnia and Herz.": "BA",
  "Central African Rep.": "CF",
  "Eq. Guinea": "GQ",
  "Solomon Is.": "SB",
  "N. Cyprus": "CY",
};

export function numericIdToAlpha2(numericId: string | number | undefined): string | null {
  if (numericId === undefined || numericId === null) return null;
  const code = countries.numericToAlpha2(String(numericId));
  return code && code.length === 2 ? code : null;
}

export function nameToAlpha2(name: string | undefined): string | null {
  if (!name) return null;
  if (NAME_TO_ALPHA2[name]) return NAME_TO_ALPHA2[name];
  const alpha2 = countries.getAlpha2Code(name, "en");
  return alpha2 && alpha2.length === 2 ? alpha2 : null;
}

export function resolveCountryCode(geo: {
  id?: string | number;
  properties?: { name?: string; ISO_A2?: string };
}): string | null {
  const props = geo.properties;
  if (props?.ISO_A2 && props.ISO_A2 !== "-99") {
    return props.ISO_A2.toUpperCase();
  }
  const fromNumeric = numericIdToAlpha2(geo.id);
  if (fromNumeric) return fromNumeric;
  return nameToAlpha2(props?.name);
}

export function getAllCountryCodes(): string[] {
  return Object.keys(countries.getAlpha2Codes()).filter((c) => c.length === 2);
}

export function getCountryNameFr(code: string): string {
  return countries.getName(code, "fr") ?? countries.getName(code, "en") ?? code;
}

export function flagFromAlpha2(code: string): string {
  if (code.length !== 2) return "🌍";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}
