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
