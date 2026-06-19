import type { Opportunity } from "@/types/opportunity";

const cache = new Map<string, Opportunity>();
const inflight = new Map<string, Promise<Opportunity | null>>();

export function getCachedOpportunity(slug: string): Opportunity | undefined {
  return cache.get(slug);
}

export function primeOpportunityCache(opportunity: Opportunity): void {
  cache.set(opportunity.slug, opportunity);
}

export function clearOpportunityCache(): void {
  cache.clear();
  inflight.clear();
}

/** Fetch lazy avec déduplication in-flight. */
export async function fetchOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  const hit = cache.get(slug);
  if (hit) return hit;

  const pending = inflight.get(slug);
  if (pending) return pending;

  const promise = fetch(`/api/opportunities/${encodeURIComponent(slug)}`)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as Opportunity;
      cache.set(slug, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(slug);
    });

  inflight.set(slug, promise);
  return promise;
}

export async function prefetchOpportunitySlugs(slugs: string[]): Promise<void> {
  const unique = Array.from(new Set(slugs.filter(Boolean)));
  await Promise.all(unique.map((slug) => fetchOpportunityBySlug(slug)));
}
