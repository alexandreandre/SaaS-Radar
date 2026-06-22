import type { FactualLead } from "./schema";
import {
  countCoveredCategories,
  assessTractionQuality,
  type TractionCategory,
} from "./traction-quality";
import {
  MIN_TRACTION_CATEGORIES,
  MIN_TRACTION_SIGNALS,
} from "./constants";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 96_000;

function fetchHeaders(): Record<string, string> {
  return {
    "User-Agent": BROWSER_UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit
): Promise<Response | null> {
  try {
    return await fetch(url, {
      ...init,
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { ...fetchHeaders(), ...(init.headers as Record<string, string> | undefined) },
    });
  } catch {
    return null;
  }
}

function responseReachable(res: Response): boolean {
  return res.ok || (res.status >= 300 && res.status < 400);
}

/** HEAD puis GET si nécessaire, avec 1 retry court sur échec réseau. */
async function urlReachable(url: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const headRes = await fetchWithTimeout(url, { method: "HEAD" });
    if (headRes && responseReachable(headRes)) return true;

    const getRes = await fetchWithTimeout(url, { method: "GET" });
    if (getRes && responseReachable(getRes)) return true;

    if (attempt < 2) await sleep(400);
  }
  return false;
}

function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function productNameTokens(productName: string): string[] {
  const stop = new Set([
    "the",
    "app",
    "saas",
    "software",
    "tool",
    "tools",
    "platform",
    "pro",
    "io",
    "ai",
  ]);

  return normalizeToken(productName)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !stop.has(token));
}

function htmlContainsProductName(html: string, productName: string): boolean {
  const haystack = normalizeToken(html);
  const tokens = productNameTokens(productName);
  if (tokens.length === 0) return true;
  return tokens.some((token) => haystack.includes(token));
}

async function readHtmlSnippet(res: Response): Promise<string> {
  try {
    const reader = res.body?.getReader();
    if (!reader) return "";

    const chunks: Uint8Array[] = [];
    let total = 0;

    while (total < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
    }

    reader.cancel().catch(() => undefined);
    const totalLen = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    const decoder = new TextDecoder("utf-8", { fatal: false });
    return decoder.decode(merged);
  } catch {
    return "";
  }
}

/**
 * Vérifie que l'URL produit n'est pas un domaine parqué / soft-404 :
 * le HTML doit mentionner au moins un token significatif du nom du produit.
 */
async function productUrlCrossCheck(url: string, productName: string): Promise<boolean> {
  const res = await fetchWithTimeout(url, { method: "GET" });
  if (!res || !responseReachable(res)) return false;

  const html = await readHtmlSnippet(res);
  if (!html.trim()) return false;

  return htmlContainsProductName(html, productName);
}

export type SourceVerification = {
  verified: boolean;
  invalidUrls: string[];
  validUrls: string[];
  validCount: number;
  totalCount: number;
  verificationLevel: "none" | "partial" | "full";
  productUrlValid: boolean;
  productCrossCheckOk: boolean;
};

export async function verifyLeadSources(lead: FactualLead): Promise<SourceVerification> {
  const urls = new Set<string>();
  if (lead.url) urls.add(lead.url);
  for (const signal of lead.tractionSignals) {
    if (signal.sourceUrl) urls.add(signal.sourceUrl);
  }

  const urlList = Array.from(urls);
  const invalidUrls: string[] = [];
  const validUrls: string[] = [];

  for (const url of urlList) {
    const ok = await urlReachable(url);
    if (ok) validUrls.push(url);
    else invalidUrls.push(url);
  }

  const validSet = new Set(validUrls);
  let productUrlValid = false;
  let productCrossCheckOk = false;

  if (lead.url && validSet.has(lead.url)) {
    productUrlValid = true;
    productCrossCheckOk = await productUrlCrossCheck(lead.url, lead.name);
  }

  const totalCount = urlList.length;
  const validCount = validUrls.length;
  let verificationLevel: SourceVerification["verificationLevel"] = "none";
  if (totalCount > 0 && validCount === totalCount) verificationLevel = "full";
  else if (validCount > 0) verificationLevel = "partial";

  return {
    verified: invalidUrls.length === 0 && totalCount > 0,
    invalidUrls,
    validUrls,
    validCount,
    totalCount,
    verificationLevel,
    productUrlValid,
    productCrossCheckOk,
  };
}

/** Gate : URL produit obligatoire, joignable et cohérente avec le nom (anti-hallucination). */
export function passesUrlGate(check: SourceVerification): boolean {
  if (!check.productUrlValid) return false;
  if (!check.productCrossCheckOk) return false;
  return true;
}

/** Retire les signaux dont la sourceUrl est morte ou absente des URLs valides. */
export function pruneTractionSignals(
  lead: FactualLead,
  validUrls: string[]
): FactualLead {
  const validSet = new Set(validUrls);
  const tractionSignals = lead.tractionSignals.filter((signal) =>
    validSet.has(signal.sourceUrl)
  );
  return { ...lead, tractionSignals };
}

/** Gate traction : minimum de signaux sourcés couvrant plusieurs catégories. */
export function passesTractionGate(lead: FactualLead): {
  ok: boolean;
  reason?: string;
  categoriesCovered?: number;
} {
  if (lead.tractionSignals.length < MIN_TRACTION_SIGNALS) {
    return {
      ok: false,
      reason: `traction insuffisante (${lead.tractionSignals.length}/${MIN_TRACTION_SIGNALS} signaux sourcés)`,
    };
  }

  const report = assessTractionQuality(lead);
  const categoriesCovered = countCoveredCategories(report);
  if (categoriesCovered < MIN_TRACTION_CATEGORIES) {
    const missing = report.missing.join(", ");
    return {
      ok: false,
      reason: `traction non couverte (${categoriesCovered}/${MIN_TRACTION_CATEGORIES} catégories ; manque: ${missing})`,
      categoriesCovered,
    };
  }

  return { ok: true, categoriesCovered };
}

export function listMissingTractionCategories(lead: FactualLead): TractionCategory[] {
  return assessTractionQuality(lead).missing;
}
