import type { MetricsSnapshot } from "@/lib/connectors/types";
import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type {
  LinkedInAdsAnalyticsDateRange,
  LinkedInAdsAnalyticsRow,
  LinkedInAdsDatePart,
} from "@/lib/connectors/linkedin-ads/types";

export function normalizeAdAccountId(id: string): string {
  const trimmed = id.trim().replace(/\s/g, "");
  if (trimmed.startsWith("urn:li:sponsoredAccount:")) {
    return trimmed.slice("urn:li:sponsoredAccount:".length);
  }
  return trimmed;
}

export function toAdAccountUrn(adAccountId: string): string {
  const normalized = normalizeAdAccountId(adAccountId);
  return `urn:li:sponsoredAccount:${normalized}`;
}

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

function formatDate(date: Date): LinkedInAdsDatePart {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function buildAnalyticsDateRange(months = 12): LinkedInAdsAnalyticsDateRange {
  const now = new Date();
  const sinceDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const start = formatDate(sinceDate);
  const end = formatDate(now);
  return {
    startYear: start.year,
    startMonth: start.month,
    startDay: start.day,
    endYear: end.year,
    endMonth: end.month,
    endDay: end.day,
  };
}

export function formatRestLiDateRange(range: LinkedInAdsAnalyticsDateRange): string {
  return `(start:(year:${range.startYear},month:${range.startMonth},day:${range.startDay}),end:(year:${range.endYear},month:${range.endMonth},day:${range.endDay}))`;
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
    source: "linkedin-ads",
  };
}

export function normalizeAnalyticsMonth(value: LinkedInAdsDatePart): string {
  const month = String(value.month).padStart(2, "0");
  return `${value.year}-${month}`;
}

export function extractAnalyticsMonth(row: LinkedInAdsAnalyticsRow): string | null {
  const start = row.dateRange?.start;
  if (!start?.year || !start.month) return null;
  return normalizeAnalyticsMonth(start);
}

export function computeConversions(row: LinkedInAdsAnalyticsRow): number {
  return (
    parseMetricNumber(row.externalWebsiteConversions) + parseMetricNumber(row.oneClickLeads)
  );
}

export function buildSnapshotsFromAnalyticsRows(
  rows: LinkedInAdsAnalyticsRow[],
  monthKeys: string[],
): MetricsSnapshot[] {
  const byMonth = new Map<
    string,
    { adSpend: number; impressions: number; clicks: number; conversions: number }
  >();

  for (const row of rows) {
    const month = extractAnalyticsMonth(row);
    if (!month) continue;

    const bucket = byMonth.get(month) ?? {
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };

    bucket.adSpend += parseSpend(row.costInLocalCurrency);
    bucket.impressions += parseMetricInt(row.impressions);
    bucket.clicks += parseMetricInt(row.clicks);
    bucket.conversions += computeConversions(row);
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
