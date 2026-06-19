import type { MetricsSnapshot } from "@/lib/connectors/types";
import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { TikTokAdsReportDateRange, TikTokAdsReportRow } from "@/lib/connectors/tiktok-ads/types";

export function normalizeAdvertiserId(id: string): string {
  return id.trim().replace(/\s/g, "");
}

export function normalizeReportMonth(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 7);
  return trimmed.slice(0, 7);
}

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildReportDateRange(months = 12): TikTokAdsReportDateRange {
  const now = new Date();
  const sinceDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return {
    startDate: formatDate(sinceDate),
    endDate: formatDate(now),
  };
}

export function parseSpend(value: string | number | undefined | null): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function parseMetricNumber(value: string | number | undefined | null): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function parseMetricInt(value: string | number | undefined | null): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed);
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
    source: "tiktok-ads",
  };
}

export function extractReportMonth(row: TikTokAdsReportRow): string | null {
  const month = row.dimensions?.stat_time_month;
  if (month) return normalizeReportMonth(month);

  const day = row.dimensions?.stat_time_day;
  if (day) return normalizeReportMonth(day);

  return null;
}

export function buildSnapshotsFromReportRows(
  rows: TikTokAdsReportRow[],
  monthKeys: string[],
): MetricsSnapshot[] {
  const byMonth = new Map<
    string,
    { adSpend: number; impressions: number; clicks: number; conversions: number }
  >();

  for (const row of rows) {
    const month = extractReportMonth(row);
    if (!month) continue;

    const bucket = byMonth.get(month) ?? {
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };

    const metrics = row.metrics ?? {};
    bucket.adSpend += parseSpend(metrics.spend);
    bucket.impressions += parseMetricInt(metrics.impressions);
    bucket.clicks += parseMetricInt(metrics.clicks);
    bucket.conversions += parseMetricNumber(metrics.conversion);
    byMonth.set(month, bucket);
  }

  return monthKeys.map((date) => {
    const bucket = byMonth.get(date);
    if (!bucket) return emptySnapshot(date);

    return {
      ...emptySnapshot(date),
      adSpend: Math.round(bucket.adSpend * 100) / 100,
      impressions: bucket.impressions,
      clicks: bucket.clicks,
      conversions: Math.round(bucket.conversions * 100) / 100,
    };
  });
}
