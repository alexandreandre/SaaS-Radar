import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { PlausibleQueryResultRow } from "@/lib/connectors/plausible/types";

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function buildDateRangeForMonths(months = 12): [string, string] {
  const monthKeys = getMonthKeys(months);
  const first = monthKeys[0];
  const last = monthKeys.at(-1);
  if (!first || !last) {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return [start, start];
  }

  const [lastYear, lastMonth] = last.split("-").map(Number);
  const endDate = new Date(lastYear!, lastMonth!, 0);
  const end = `${lastYear}-${String(lastMonth).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  return [`${first}-01`, end];
}

export function normalizeMonthSegment(value: string): string {
  return value.slice(0, 7);
}

export function parseMonthlyVisitors(rows: PlausibleQueryResultRow[]): Map<string, number> {
  const byMonth = new Map<string, number>();

  for (const row of rows) {
    const monthRaw = row.dimensions[0];
    if (!monthRaw) continue;
    const month = normalizeMonthSegment(monthRaw);
    const visitors = row.metrics[0];
    byMonth.set(month, Math.max(0, Math.round(Number(visitors ?? 0))));
  }

  return byMonth;
}

export function aggregateDailyVisitorsToDau(rows: PlausibleQueryResultRow[]): Map<string, number> {
  const dailyByMonth = new Map<string, number[]>();

  for (const row of rows) {
    const dayRaw = row.dimensions[0];
    if (!dayRaw) continue;
    const month = normalizeMonthSegment(dayRaw);
    const visitors = Math.max(0, Number(row.metrics[0] ?? 0));
    const bucket = dailyByMonth.get(month) ?? [];
    bucket.push(visitors);
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

export function parseMonthlySignups(rows: PlausibleQueryResultRow[]): Map<string, number> {
  const byMonth = new Map<string, number>();

  for (const row of rows) {
    const monthRaw = row.dimensions[0];
    if (!monthRaw) continue;
    const month = normalizeMonthSegment(monthRaw);
    const events = row.metrics[0];
    byMonth.set(month, Math.max(0, Math.round(Number(events ?? 0))));
  }

  return byMonth;
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
    source: "plausible",
  };
}

export function buildSnapshotsFromQueryResults(input: {
  monthKeys: string[];
  monthlyVisitors: Map<string, number>;
  dauByMonth: Map<string, number>;
  signupsByMonth: Map<string, number>;
}): MetricsSnapshot[] {
  const { monthKeys, monthlyVisitors, dauByMonth, signupsByMonth } = input;

  return monthKeys.map((date) => {
    const mau = monthlyVisitors.get(date) ?? 0;
    const dau = dauByMonth.get(date) ?? 0;
    const signups = signupsByMonth.get(date) ?? 0;

    return {
      ...emptySnapshot(date),
      signups,
      activeUsers: mau,
      mau,
      dau,
    };
  });
}
