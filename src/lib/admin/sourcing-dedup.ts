import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity } from "@/types/opportunity";
import type { DedupMatch } from "@/lib/admin/sourcing-dedup.shared";

export type { DedupMatch } from "@/lib/admin/sourcing-dedup.shared";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function nameSimilarity(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  return 1 - levenshtein(na, nb) / maxLen;
}

function rootDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length < 2) return host;
    return parts.slice(-2).join(".");
  } catch {
    return null;
  }
}

export function findDedupMatches(
  opportunity: Opportunity,
  existing: {
    slugs: Set<string>;
    names: Set<string>;
    urls: Set<string>;
    nameToSlug?: Map<string, string>;
    domainToSlug?: Map<string, string>;
  }
): DedupMatch[] {
  const matches: DedupMatch[] = [];
  const slug = opportunity.slug;
  const nameKey = opportunity.name.toLowerCase().trim();

  if (existing.slugs.has(slug)) {
    matches.push({ type: "slug", value: slug, existingSlug: slug });
  }
  if (existing.names.has(nameKey)) {
    matches.push({
      type: "name",
      value: nameKey,
      existingName: opportunity.name,
      existingSlug: existing.nameToSlug?.get(nameKey),
    });
  }
  if (opportunity.url) {
    const urlKey = opportunity.url.toLowerCase().trim();
    if (existing.urls.has(urlKey)) {
      matches.push({ type: "url", value: urlKey });
    }
    const domain = rootDomain(opportunity.url);
    if (domain && existing.domainToSlug?.has(domain)) {
      matches.push({
        type: "domain",
        value: domain,
        existingSlug: existing.domainToSlug.get(domain),
      });
    }
  }

  if (existing.nameToSlug) {
    for (const [existingName, existingSlug] of Array.from(existing.nameToSlug.entries())) {
      if (existingName === nameKey) continue;
      const sim = nameSimilarity(nameKey, existingName);
      if (sim >= 0.88) {
        matches.push({
          type: "name_fuzzy",
          value: existingName,
          existingName,
          existingSlug,
          similarity: Math.round(sim * 100) / 100,
        });
      }
    }
  }

  return matches;
}

export async function loadExistingForDedup(
  supabase: ReturnType<typeof createAdminClient>
): Promise<{
  slugs: Set<string>;
  names: Set<string>;
  urls: Set<string>;
  nameToSlug: Map<string, string>;
  domainToSlug: Map<string, string>;
}> {
  const { data, error } = await supabase.from("opportunities").select("slug,name,url");
  if (error) throw new Error(error.message);
  const slugs = new Set<string>();
  const names = new Set<string>();
  const urls = new Set<string>();
  const nameToSlug = new Map<string, string>();
  const domainToSlug = new Map<string, string>();

  for (const row of data ?? []) {
    const r = row as { slug?: string; name?: string; url?: string | null };
    if (r.slug) slugs.add(r.slug);
    if (r.name) {
      const key = r.name.toLowerCase().trim();
      names.add(key);
      if (r.slug) nameToSlug.set(key, r.slug);
    }
    if (r.url) {
      urls.add(r.url.toLowerCase().trim());
      const domain = rootDomain(r.url);
      if (domain && r.slug) domainToSlug.set(domain, r.slug);
    }
  }
  return { slugs, names, urls, nameToSlug, domainToSlug };
}
