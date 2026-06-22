import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCatalogueStats } from "@/lib/admin/catalogue-stats";
import { resolvePublishedArchivedDuplicates } from "@/lib/admin/catalogue-dedup";

const LIST_COLUMNS =
  "slug, name, sector, origin_country_code, origin_flag, status, weekly_pick, created_at, published_at, buildable_under_30_days, ai_powered, scores";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export type AdminOpportunitiesListParams = {
  status?: string | null;
  q?: string | null;
  sector?: string | null;
  country?: string | null;
  minScore?: number | null;
  sort?: string | null;
  limit?: number;
  offset?: number;
};

export type AdminOpportunitiesListResult = {
  opportunities: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
  truncated: boolean;
};

export async function listAdminOpportunities(
  params: AdminOpportunitiesListParams = {}
): Promise<AdminOpportunitiesListResult> {
  await resolvePublishedArchivedDuplicates();

  const rawStatus = params.status ?? "published";
  const status =
    rawStatus === "archived" ? "archived" : rawStatus === "draft" ? "draft" : "published";
  const q = params.q?.trim();
  const sector = params.sector ?? null;
  const country = params.country ?? null;
  const sort = params.sort ?? "newest";
  const minScore = params.minScore ?? null;
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(params.offset ?? 0, 0);

  const admin = createAdminClient();
  let query = admin.from("opportunities").select(LIST_COLUMNS, { count: "exact" }).eq("status", status);

  if (sector) query = query.eq("sector", sector);
  if (country) query = query.eq("origin_country_code", country.toUpperCase());
  if (q) {
    const safe = q.replace(/[%_,"()]/g, "").slice(0, 80);
    if (safe) {
      query = query.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%,pitch.ilike.%${safe}%`);
    }
  }
  if (minScore != null && !Number.isNaN(minScore)) {
    query = query.gte("scores->>opportunity", String(minScore));
  }

  switch (sort) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "opportunity":
      query = query.order("scores->>opportunity", { ascending: false, nullsFirst: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  const allRows = (data ?? []) as Record<string, unknown>[];
  const opportunities = allRows.filter(
    (row) => String(row.status ?? "published") === status
  );
  const total =
    opportunities.length === allRows.length
      ? (count ?? opportunities.length)
      : opportunities.length;
  return {
    opportunities,
    total,
    limit,
    offset,
    truncated: (count ?? 0) > offset + opportunities.length,
  };
}

export async function getAdminOpportunitiesPageData(params: AdminOpportunitiesListParams = {}) {
  const [list, stats] = await Promise.all([listAdminOpportunities(params), getCatalogueStats()]);
  return { list, stats };
}

export type AdminOpportunitiesPageData = Awaited<ReturnType<typeof getAdminOpportunitiesPageData>>;
