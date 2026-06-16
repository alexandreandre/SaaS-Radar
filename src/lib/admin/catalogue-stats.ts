import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CatalogueStats } from "@/lib/admin/catalogue-stats.shared";
import { TERMINAL_RUN_STATUSES } from "@/lib/admin/sourcing-run-status";

export type { CatalogueStats, SectorCoverage, CountryCoverage } from "@/lib/admin/catalogue-stats.shared";

const LOW_CATALOGUE_THRESHOLD = 20;
const CONCENTRATION_THRESHOLD = 0.7;

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function readScore(scores: unknown): number | undefined {
  if (!scores || typeof scores !== "object") return undefined;
  const val = (scores as Record<string, unknown>).opportunity;
  return typeof val === "number" ? val : undefined;
}

export async function getCatalogueStats(): Promise<CatalogueStats> {
  const admin = createAdminClient();

  const [
    publishedRes,
    archivedRes,
    draftRes,
    pendingDraftsRes,
    weeklyPickRes,
    lastRunRes,
    marketsRes,
    allPublishedRes,
  ] = await Promise.all([
    admin.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "archived"),
    admin.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "draft"),
    admin
      .from("opportunity_drafts")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("opportunities")
      .select("slug, name, scores")
      .eq("weekly_pick", true)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("sourcing_runs")
      .select("status, started_at, count_written")
      .in("status", TERMINAL_RUN_STATUSES)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("world_markets")
      .select("code, name, flag")
      .in("scope", ["priority", "active", "emerging"]),
    admin
      .from("opportunities")
      .select("origin_country_code, origin_flag, sector, scores, published_at, created_at")
      .eq("status", "published"),
  ]);

  const published = allPublishedRes.data ?? [];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const scores = published
    .map((o) => readScore(o.scores))
    .filter((s): s is number => typeof s === "number");

  const publishedThisWeek = published.filter((o) => {
    const ts = o.published_at ?? o.created_at;
    return new Date(ts).getTime() >= weekAgo;
  }).length;

  const lastPublishedAt = published.reduce<string | null>((latest, o) => {
    const ts = o.published_at ?? o.created_at;
    if (!latest || ts > latest) return ts;
    return latest;
  }, null);

  const sectorMap = new Map<string, number[]>();
  for (const o of published) {
    const score = readScore(o.scores);
    const arr = sectorMap.get(o.sector) ?? [];
    if (typeof score === "number") arr.push(score);
    sectorMap.set(o.sector, arr);
  }

  const bySector = Array.from(sectorMap.entries())
    .map(([sector, sectorScores]) => ({
      sector,
      count: published.filter((o) => o.sector === sector).length,
      medianScore: median(sectorScores) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const countryMap = new Map<string, { scores: number[]; flag: string }>();
  for (const o of published) {
    const code = o.origin_country_code;
    const existing = countryMap.get(code);
    const entry = existing ?? { scores: [] as number[], flag: o.origin_flag };
    const score = readScore(o.scores);
    if (typeof score === "number") entry.scores.push(score);
    countryMap.set(code, entry);
  }

  const markets = marketsRes.data ?? [];
  const marketNameMap = new Map(markets.map((m) => [m.code, m]));

  const byCountry = Array.from(countryMap.entries())
    .map(([code, { scores: countryScores, flag }]) => ({
      code,
      name: marketNameMap.get(code)?.name ?? code,
      flag,
      count: published.filter((o) => o.origin_country_code === code).length,
      medianScore: median(countryScores) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const publishedCodes = new Set(published.map((o) => o.origin_country_code));
  const marketsWithoutCoverage = markets.filter((m) => !publishedCodes.has(m.code));

  const countryCounts = new Map<string, number>();
  for (const o of published) {
    countryCounts.set(o.origin_country_code, (countryCounts.get(o.origin_country_code) ?? 0) + 1);
  }

  let topCountryCode: string | null = null;
  let topCount = 0;
  for (const [code, count] of Array.from(countryCounts.entries())) {
    if (count > topCount) {
      topCount = count;
      topCountryCode = code;
    }
  }

  const topCountryShare = published.length > 0 ? topCount / published.length : 0;
  const publishedCount = publishedRes.count ?? 0;

  const alerts: string[] = [];
  if (publishedCount < LOW_CATALOGUE_THRESHOLD) {
    alerts.push(
      `Catalogue faible : ${publishedCount} fiche(s) publiée(s) (seuil ${LOW_CATALOGUE_THRESHOLD})`
    );
  }
  if (!weeklyPickRes.data) {
    alerts.push("Aucun pick de la semaine actif");
  }
  if (topCountryShare > CONCENTRATION_THRESHOLD && topCountryCode) {
    alerts.push(
      `Concentration élevée : ${Math.round(topCountryShare * 100)} % des fiches proviennent de ${topCountryCode}`
    );
  }
  if (marketsWithoutCoverage.length > 0) {
    alerts.push(`${marketsWithoutCoverage.length} marché(s) actif(s) sans fiche publiée`);
  }

  return {
    byStatus: {
      published: publishedCount,
      archived: archivedRes.count ?? 0,
      draft: draftRes.count ?? 0,
    },
    pendingDrafts: pendingDraftsRes.count ?? 0,
    publishedThisWeek,
    medianScore: median(scores),
    lastPublishedAt,
    weeklyPick: weeklyPickRes.data
      ? {
          slug: weeklyPickRes.data.slug,
          name: weeklyPickRes.data.name,
          score: readScore(weeklyPickRes.data.scores) ?? null,
        }
      : null,
    bySector,
    byCountry,
    marketsWithoutCoverage,
    diversity: {
      uniqueCountries: countryCounts.size,
      topCountryCode,
      topCountryShare,
    },
    alerts,
    lastRun: lastRunRes.data
      ? {
          status: lastRunRes.data.status,
          started_at: lastRunRes.data.started_at,
          count_written: lastRunRes.data.count_written ?? 0,
        }
      : null,
  };
}
