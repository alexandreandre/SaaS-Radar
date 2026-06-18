import type { MetricsSnapshot } from "@/lib/connectors/types";
import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { GoogleAdsGaqlRow } from "@/lib/connectors/google-ads/types";

export const GOOGLE_ADS_API_VERSION = "v24";

export function microsToCurrency(micros: string | number | undefined | null): number {
  const value = typeof micros === "string" ? Number(micros) : (micros ?? 0);
  if (!Number.isFinite(value)) return 0;
  return value / 1_000_000;
}

export function normalizeCustomerId(id: string): string {
  return id.replace(/^customers\//, "").replace(/-/g, "").trim();
}

export function normalizeMonthSegment(month: string): string {
  return month.slice(0, 7);
}

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function buildMonthlyMetricsQuery(months = 12): string {
  if (months === 12) {
    return `SELECT
  segments.month,
  metrics.cost_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.conversions
FROM customer
WHERE segments.month DURING LAST_12_MONTHS`;
  }

  return `SELECT
  segments.month,
  metrics.cost_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.conversions
FROM customer
WHERE segments.month DURING LAST_${months}_MONTHS`;
}

function emptySnapshot(date: string): MetricsSnapshot {
  return {
    date,
    mrr: 0,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    customers: 0,
    signups: 0,
    trials: 0,
    activeUsers: 0,
    mau: 0,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    source: "google-ads",
  };
}

export function buildSnapshotsFromGaqlRows(
  rows: GoogleAdsGaqlRow[],
  monthKeys: string[],
): MetricsSnapshot[] {
  const byMonth = new Map<
    string,
    { adSpend: number; impressions: number; clicks: number; conversions: number }
  >();

  for (const row of rows) {
    const monthRaw = row.segments?.month;
    if (!monthRaw) continue;

    const month = normalizeMonthSegment(monthRaw);
    const bucket = byMonth.get(month) ?? {
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };

    bucket.adSpend += microsToCurrency(row.metrics?.costMicros);
    bucket.impressions += Number(row.metrics?.impressions ?? 0);
    bucket.clicks += Number(row.metrics?.clicks ?? 0);
    bucket.conversions += Number(row.metrics?.conversions ?? 0);
    byMonth.set(month, bucket);
  }

  return monthKeys.map((date) => {
    const bucket = byMonth.get(date);
    if (!bucket) return emptySnapshot(date);

    return {
      ...emptySnapshot(date),
      adSpend: Math.round(bucket.adSpend * 100) / 100,
      impressions: Math.round(bucket.impressions),
      clicks: Math.round(bucket.clicks),
      conversions: Math.round(bucket.conversions * 100) / 100,
    };
  });
}
