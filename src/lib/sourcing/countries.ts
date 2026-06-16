import { createClient } from "@supabase/supabase-js";

export type SourcingCountry = {
  code: string;
  name: string;
  flag: string;
};

const ISO2 = /^[A-Z]{2}$/;

let cachedCountries: SourcingCountry[] | null = null;
let cacheAt = 0;
const CACHE_MS = 60_000;

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

export function normalizeCountryCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isIso2CountryCode(code: string): boolean {
  return ISO2.test(normalizeCountryCode(code));
}

export async function loadSourcingCountries(): Promise<SourcingCountry[]> {
  const now = Date.now();
  if (cachedCountries && now - cacheAt < CACHE_MS) return cachedCountries;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("world_markets")
    .select("code, name, flag")
    .order("heat_score", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (rows.length === 0) {
    const { getAllCountryCodes, getCountryNameFr, flagFromAlpha2 } = await import(
      "@/lib/country-code"
    );
    cachedCountries = getAllCountryCodes().map((code) => ({
      code: normalizeCountryCode(code),
      name: getCountryNameFr(code),
      flag: flagFromAlpha2(code),
    }));
  } else {
    cachedCountries = rows.map((row) => ({
      code: normalizeCountryCode(row.code as string),
      name: row.name as string,
      flag: row.flag as string,
    }));
  }
  cacheAt = now;
  return cachedCountries;
}

export async function assertValidCountryCode(code: string): Promise<SourcingCountry> {
  const normalized = normalizeCountryCode(code);
  if (!isIso2CountryCode(normalized)) {
    throw new Error(`Code pays invalide : "${code}" (attendu ISO2, ex. US, GB)`);
  }
  const countries = await loadSourcingCountries();
  const found = countries.find((c) => c.code === normalized);
  if (found) return found;

  // Fallback si world_markets pas encore seedé en base
  const { getCountryNameFr, flagFromAlpha2 } = await import("@/lib/country-code");
  return {
    code: normalized,
    name: getCountryNameFr(normalized),
    flag: flagFromAlpha2(normalized),
  };
}

export async function assertValidCountryCodes(codes: string[]): Promise<SourcingCountry[]> {
  if (codes.length === 0) {
    throw new Error("Sélectionnez au moins un pays");
  }
  const unique = Array.from(new Set(codes.map(normalizeCountryCode)));
  const resolved: SourcingCountry[] = [];
  for (const code of unique) {
    resolved.push(await assertValidCountryCode(code));
  }
  return resolved;
}

export function getCountryPromptLine(country: SourcingCountry): string {
  return `Concentre-toi UNIQUEMENT sur des micro-SaaS opérant principalement sur le marché ${country.name} (${country.code}). Chaque lead DOIT avoir originCountryCode="${country.code}" et originCountry="${country.name}".`;
}

export const DEFAULT_SOURCING_COUNTRY = "US";

export const MAX_COUNTRIES_PER_BATCH = 5;
