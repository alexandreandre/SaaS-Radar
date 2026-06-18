import type { MetricsSnapshot } from "@/lib/connectors/types";
import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { MetaAdsAction, MetaAdsInsightRow, MetaAdsInsightsTimeRange } from "@/lib/connectors/meta-ads/types";

export const META_ADS_API_VERSION = "v25.0";

const CONVERSION_ACTION_TYPES = new Set([
  "purchase",
  "lead",
  "complete_registration",
  "omni_purchase",
  "subscribe",
  "contact",
  "submit_application",
]);

const CONVERSION_ACTION_PREFIXES = ["offsite_conversion", "onsite_conversion"];

export function normalizeAdAccountId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("act_")) return trimmed;
  return `act_${trimmed.replace(/^act_/, "")}`;
}

export function normalizeInsightMonth(dateStart: string): string {
  return dateStart.slice(0, 7);
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

export function buildInsightsTimeRange(months = 12): MetaAdsInsightsTimeRange {
  const now = new Date();
  const sinceDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return {
    since: formatDate(sinceDate),
    until: formatDate(now),
  };
}

export function parseSpend(spend: string | undefined | null): number {
  const value = parseFloat(spend ?? "0");
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function parseMetricInt(value: string | undefined | null): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed);
}

export function isConversionAction(actionType: string): boolean {
  if (CONVERSION_ACTION_TYPES.has(actionType)) return true;
  return CONVERSION_ACTION_PREFIXES.some((prefix) => actionType.startsWith(prefix));
}

export function sumConversionActions(actions: MetaAdsAction[] | undefined): number {
  if (!actions?.length) return 0;

  let total = 0;
  for (const action of actions) {
    const actionType = action.action_type?.trim();
    if (!actionType || !isConversionAction(actionType)) continue;
    total += parseFloat(action.value ?? "0") || 0;
  }

  return Math.round(total * 100) / 100;
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
    source: "meta-ads",
  };
}

export function buildSnapshotsFromInsightRows(
  rows: MetaAdsInsightRow[],
  monthKeys: string[],
): MetricsSnapshot[] {
  const byMonth = new Map<
    string,
    { adSpend: number; impressions: number; clicks: number; conversions: number }
  >();

  for (const row of rows) {
    const dateStart = row.date_start;
    if (!dateStart) continue;

    const month = normalizeInsightMonth(dateStart);
    const bucket = byMonth.get(month) ?? {
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };

    bucket.adSpend += parseSpend(row.spend);
    bucket.impressions += parseMetricInt(row.impressions);
    bucket.clicks += parseMetricInt(row.clicks);
    bucket.conversions += sumConversionActions(row.actions);
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
