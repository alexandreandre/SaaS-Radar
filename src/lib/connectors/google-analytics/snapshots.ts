import {
  buildDateRangeForMonths,
  getMonthKeys,
} from "@/lib/connectors/plausible/snapshots";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { GaRunReportRow } from "@/lib/connectors/google-analytics/types";

export { buildDateRangeForMonths, getMonthKeys };

export function normalizePropertyId(propertyId: string): string {
  return propertyId.replace(/^properties\//, "").replace(/\D/g, "").trim();
}

export function yearMonthToMonthKey(yearMonth: string): string {
  const raw = yearMonth.trim();
  if (/^\d{6}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
  }
  return raw.slice(0, 7);
}

export function parseYearMonthMetricRows(rows: GaRunReportRow[]): Map<string, number> {
  const byMonth = new Map<string, number>();

  for (const row of rows) {
    const yearMonth = row.dimensionValues?.[0]?.value;
    if (!yearMonth) continue;
    const month = yearMonthToMonthKey(yearMonth);
    const value = Math.max(0, Math.round(Number(row.metricValues?.[0]?.value ?? 0)));
    byMonth.set(month, value);
  }

  return byMonth;
}

export function dateDimensionToMonthKey(dateRaw: string): string {
  const raw = dateRaw.trim();
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
  }
  return raw.slice(0, 7);
}

export function aggregateDailyActiveUsersToDau(rows: GaRunReportRow[]): Map<string, number> {
  const dailyByMonth = new Map<string, number[]>();

  for (const row of rows) {
    const dateRaw = row.dimensionValues?.[0]?.value;
    if (!dateRaw) continue;
    const month = dateDimensionToMonthKey(dateRaw);
    const users = Math.max(0, Number(row.metricValues?.[0]?.value ?? 0));
    const bucket = dailyByMonth.get(month) ?? [];
    bucket.push(users);
    dailyByMonth.set(month, bucket);
  }

  const dauByMonth = new Map<string, number>();
  dailyByMonth.forEach((values, month) => {
    if (values.length === 0) {
      dauByMonth.set(month, 0);
      return;
    }
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    dauByMonth.set(month, Math.round(avg));
  });

  return dauByMonth;
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
    source: "google-analytics",
  };
}

export function buildSnapshotsFromReports(input: {
  monthKeys: string[];
  mauByMonth: Map<string, number>;
  dauByMonth: Map<string, number>;
  signupsByMonth: Map<string, number>;
  trialsByMonth: Map<string, number>;
}): MetricsSnapshot[] {
  const { monthKeys, mauByMonth, dauByMonth, signupsByMonth, trialsByMonth } = input;

  return monthKeys.map((date) => {
    const mau = mauByMonth.get(date) ?? 0;
    const dau = dauByMonth.get(date) ?? 0;
    const signups = signupsByMonth.get(date) ?? 0;
    const trials = trialsByMonth.get(date) ?? 0;

    return {
      ...emptySnapshot(date),
      signups,
      trials,
      activeUsers: mau,
      mau,
      dau,
    };
  });
}
