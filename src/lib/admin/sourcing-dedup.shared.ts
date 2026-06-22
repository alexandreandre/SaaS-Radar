export type DedupMatch = {
  type: "slug" | "name" | "url" | "name_fuzzy" | "domain";
  value: string;
  existingSlug?: string;
  existingName?: string;
  similarity?: number;
};

export const BLOCKING_DEDUP_TYPES: DedupMatch["type"][] = ["slug", "url", "domain"];

export function hasBlockingDedup(matches: DedupMatch[]): boolean {
  return matches.some((m) => BLOCKING_DEDUP_TYPES.includes(m.type));
}

export function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.search = "";
    let path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase().trim().replace(/\/+$/, "");
  }
}

export function rootDomainFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length < 2) return host;
    return parts.slice(-2).join(".");
  } catch {
    return null;
  }
}

export type DedupIndex = {
  slugs: Set<string>;
  names: Set<string>;
  urls: Set<string>;
  nameToSlug: Map<string, string>;
  domainToSlug: Map<string, string>;
};

export function registerOpportunityInDedupIndex(
  index: DedupIndex,
  row: { slug: string; name: string; url?: string | null }
): void {
  index.slugs.add(row.slug);
  const nameKey = row.name.toLowerCase().trim();
  index.names.add(nameKey);
  index.nameToSlug.set(nameKey, row.slug);
  if (row.url) {
    index.urls.add(normalizeUrlKey(row.url));
    const domain = rootDomainFromUrl(row.url);
    if (domain) index.domainToSlug.set(domain, row.slug);
  }
}

export function isBlockedByDedupIndex(
  index: DedupIndex,
  row: { slug: string; name: string; url?: string | null }
): boolean {
  const nameKey = row.name.toLowerCase().trim();
  if (index.slugs.has(row.slug) || index.names.has(nameKey)) return true;
  if (!row.url) return false;
  const urlKey = normalizeUrlKey(row.url);
  if (index.urls.has(urlKey)) return true;
  const domain = rootDomainFromUrl(row.url);
  return domain != null && index.domainToSlug.has(domain);
}
