import type { Opportunity } from "@/types/opportunity";
import type { DedupMatch } from "@/lib/admin/sourcing-dedup.shared";

export type DraftStatus = "pending" | "approved" | "rejected" | "published";

export type OpportunityDraftRow = {
  id: string;
  source_run_id: string | null;
  slug: string;
  name: string;
  payload: Opportunity;
  score: number | null;
  status: DraftStatus;
  dedup_matches: DedupMatch[];
  live_dedup_matches?: DedupMatch[];
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  source_lead: unknown;
  source_verified: boolean | null;
  invalid_urls: string[];
  verification_level: string;
  needs_review: boolean;
  fact_confidence: "low" | "medium" | "high" | null;
  premium_verified: boolean | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export function parseDraftPayload(raw: unknown): Opportunity {
  return raw as Opportunity;
}

export function parseDedupMatches(raw: unknown): DedupMatch[] {
  if (!Array.isArray(raw)) return [];
  return raw as DedupMatch[];
}

export function parseInvalidUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === "string");
}

export function normalizeDraftRow(row: Record<string, unknown>): OpportunityDraftRow {
  const payload = parseDraftPayload(row.payload);
  return {
    id: String(row.id),
    source_run_id: row.source_run_id != null ? String(row.source_run_id) : null,
    slug: String(row.slug ?? payload.slug ?? ""),
    name: String(row.name ?? payload.name ?? ""),
    payload,
    score: row.score != null ? Number(row.score) : null,
    status: (row.status as DraftStatus) ?? "pending",
    dedup_matches: parseDedupMatches(row.dedup_matches),
    live_dedup_matches: parseDedupMatches(row.live_dedup_matches),
    review_notes: row.review_notes != null ? String(row.review_notes) : null,
    reviewed_by: row.reviewed_by != null ? String(row.reviewed_by) : null,
    reviewed_at: row.reviewed_at != null ? String(row.reviewed_at) : null,
    source_lead: row.source_lead ?? null,
    source_verified: row.source_verified === true,
    invalid_urls: parseInvalidUrls(row.invalid_urls),
    verification_level: String(row.verification_level ?? "none"),
    needs_review: row.needs_review === true,
    fact_confidence:
      row.fact_confidence === "low" ||
      row.fact_confidence === "medium" ||
      row.fact_confidence === "high"
        ? row.fact_confidence
        : null,
    premium_verified: row.premium_verified === true ? true : row.premium_verified === false ? false : null,
    rejection_reason: row.rejection_reason != null ? String(row.rejection_reason) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export function draftListMeta(draft: OpportunityDraftRow): {
  countryCode: string;
  sector: string;
} {
  return {
    countryCode: draft.payload.originCountryCode ?? "—",
    sector: draft.payload.sector ?? "—",
  };
}

export function effectiveDedupMatches(draft: OpportunityDraftRow): DedupMatch[] {
  if (draft.live_dedup_matches && draft.live_dedup_matches.length > 0) {
    return draft.live_dedup_matches;
  }
  return draft.dedup_matches;
}

export function hasPendingDraftDedup(draft: OpportunityDraftRow): boolean {
  return effectiveDedupMatches(draft).some((m) => m.source === "pending_draft");
}
