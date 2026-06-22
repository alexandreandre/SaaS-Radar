import type { FactualLead } from "./schema";

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "The-Build-Road-Sourcing/1.0" },
    });
    if (res.ok) return true;
    if (res.status === 405 || res.status === 403) {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "The-Build-Road-Sourcing/1.0" },
      });
      return getRes.ok;
    }
    return false;
  } catch {
    return false;
  }
}

export type SourceVerification = {
  verified: boolean;
  invalidUrls: string[];
  validCount: number;
  totalCount: number;
  verificationLevel: "none" | "partial" | "full";
};

export async function verifyLeadSources(lead: FactualLead): Promise<SourceVerification> {
  const urls = new Set<string>();
  if (lead.url) urls.add(lead.url);
  for (const signal of lead.tractionSignals) {
    if (signal.sourceUrl) urls.add(signal.sourceUrl);
  }

  const urlList = Array.from(urls);
  const invalidUrls: string[] = [];
  let validCount = 0;

  for (const url of urlList) {
    const ok = await headOk(url);
    if (ok) validCount++;
    else invalidUrls.push(url);
  }

  const totalCount = urlList.length;
  let verificationLevel: SourceVerification["verificationLevel"] = "none";
  if (totalCount > 0 && validCount === totalCount) verificationLevel = "full";
  else if (validCount > 0) verificationLevel = "partial";

  return {
    verified: invalidUrls.length === 0 && totalCount > 0,
    invalidUrls,
    validCount,
    totalCount,
    verificationLevel,
  };
}

/** Gate v1 : skip si aucune URL joignable (produit ou traction). */
export function passesUrlGate(check: SourceVerification): boolean {
  if (check.totalCount === 0) return false;
  if (check.validCount === 0) return false;
  if (check.totalCount > 0 && check.validCount / check.totalCount < 0.5) return false;
  return true;
}
