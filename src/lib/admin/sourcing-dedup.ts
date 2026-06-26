import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity } from "@/types/opportunity";
import type { DedupMatch, DedupIndex } from "@/lib/admin/sourcing-dedup.shared";
import {
  createEmptyDedupIndex,
  registerOpportunityInDedupIndex,
  rootDomainFromUrl,
  normalizeUrlKey,
} from "@/lib/admin/sourcing-dedup.shared";

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

function matchMeta(
  index: DedupIndex,
  existingSlug?: string
): Pick<DedupMatch, "source" | "existingDraftId"> {
  if (!existingSlug) return {};
  const isPending = index.pendingDraftSlugs.has(existingSlug);
  return {
    source: isPending ? "pending_draft" : "catalogue",
    existingDraftId: index.slugToDraftId.get(existingSlug),
  };
}

function shouldSkipSelfMatch(
  match: DedupMatch,
  opts?: { excludeDraftId?: string; excludeSlug?: string }
): boolean {
  if (!opts) return false;
  if (opts.excludeDraftId && match.existingDraftId === opts.excludeDraftId) return true;
  if (opts.excludeSlug && match.existingSlug === opts.excludeSlug && match.type === "slug") {
    return true;
  }
  return false;
}

export function findDedupMatches(
  opportunity: Opportunity,
  existing: DedupIndex,
  opts?: { excludeDraftId?: string; excludeSlug?: string }
): DedupMatch[] {
  const matches: DedupMatch[] = [];
  const slug = opportunity.slug;
  const nameKey = opportunity.name.toLowerCase().trim();

  const push = (match: DedupMatch) => {
    if (shouldSkipSelfMatch(match, opts)) return;
    matches.push(match);
  };

  if (existing.slugs.has(slug)) {
    push({
      type: "slug",
      value: slug,
      existingSlug: slug,
      ...matchMeta(existing, slug),
    });
  }
  if (existing.names.has(nameKey)) {
    const existingSlug = existing.nameToSlug.get(nameKey);
    push({
      type: "name",
      value: nameKey,
      existingName: opportunity.name,
      existingSlug,
      ...matchMeta(existing, existingSlug),
    });
  }
  if (opportunity.url) {
    const urlKey = normalizeUrlKey(opportunity.url);
    if (existing.urls.has(urlKey)) {
      push({ type: "url", value: urlKey });
    }
    const domain = rootDomainFromUrl(opportunity.url);
    if (domain && existing.domainToSlug.has(domain)) {
      const existingSlug = existing.domainToSlug.get(domain);
      push({
        type: "domain",
        value: domain,
        existingSlug,
        ...matchMeta(existing, existingSlug),
      });
    }
  }

  for (const [existingName, existingSlug] of Array.from(existing.nameToSlug.entries())) {
    if (existingName === nameKey) continue;
    const sim = nameSimilarity(nameKey, existingName);
    if (sim >= 0.88) {
      push({
        type: "name_fuzzy",
        value: existingName,
        existingName,
        existingSlug,
        similarity: Math.round(sim * 100) / 100,
        ...matchMeta(existing, existingSlug),
      });
    }
  }

  return matches;
}

export async function loadExistingForDedup(
  supabase: ReturnType<typeof createAdminClient>
): Promise<DedupIndex> {
  const { data, error } = await supabase.from("opportunities").select("slug,name,url,status");
  if (error) throw new Error(error.message);

  const index = createEmptyDedupIndex();

  for (const row of data ?? []) {
    const r = row as { slug?: string; name?: string; url?: string | null };
    if (!r.slug || !r.name) continue;
    registerOpportunityInDedupIndex(index, {
      slug: r.slug,
      name: r.name,
      url: r.url,
    });
    index.catalogueSlugs.add(r.slug);
  }

  const { data: pendingDrafts, error: pendingError } = await supabase
    .from("opportunity_drafts")
    .select("id,slug,name,payload")
    .eq("status", "pending");
  if (pendingError) throw new Error(pendingError.message);

  for (const row of pendingDrafts ?? []) {
    const r = row as {
      id?: string;
      slug?: string;
      name?: string;
      payload?: { url?: string | null };
    };
    if (!r.id || !r.slug || !r.name) continue;
    registerOpportunityInDedupIndex(index, {
      slug: r.slug,
      name: r.name,
      url: r.payload?.url ?? null,
    });
    index.pendingDraftSlugs.add(r.slug);
    index.slugToDraftId.set(r.slug, r.id);
  }

  return index;
}

export {
  registerOpportunityInDedupIndex,
  isBlockedByDedupIndex,
  createEmptyDedupIndex,
} from "@/lib/admin/sourcing-dedup.shared";
export { normalizeUrlKey, rootDomainFromUrl, DEDUP_TYPE_LABELS } from "@/lib/admin/sourcing-dedup.shared";
