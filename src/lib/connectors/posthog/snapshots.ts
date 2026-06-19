import {
  buildDateRangeForMonths,
  getMonthKeys,
  normalizeMonthSegment,
} from "@/lib/connectors/plausible/snapshots";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { HogQLQueryRow } from "@/lib/connectors/posthog/types";

export { buildDateRangeForMonths, getMonthKeys };

export function parseHogQLMonthlyRows(rows: HogQLQueryRow[]): Map<string, number> {
  const byMonth = new Map<string, number>();
  for (const row of rows) {
    const month = normalizeMonthSegment(row.month);
    byMonth.set(month, Math.max(0, Math.round(Number(row.value ?? 0))));
  }
  return byMonth;
}

export function aggregateDailyRowsToDau(rows: HogQLQueryRow[]): Map<string, number> {
  const dailyByMonth = new Map<string, number[]>();

  for (const row of rows) {
    const month = normalizeMonthSegment(row.month);
    const visitors = Math.max(0, Number(row.value ?? 0));
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
    source: "posthog",
  };
}

export function buildSnapshotsFromQueryResults(input: {
  monthKeys: string[];
  mauByMonth: Map<string, number>;
  dauByMonth: Map<string, number>;
  signupsByMonth: Map<string, number>;
}): MetricsSnapshot[] {
  const { monthKeys, mauByMonth, dauByMonth, signupsByMonth } = input;

  return monthKeys.map((date) => {
    const mau = mauByMonth.get(date) ?? 0;
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

export function hogQLRowsFromResults(
  results: unknown[][] | undefined,
  columns: string[] | undefined,
): HogQLQueryRow[] {
  if (!results?.length || !columns?.length) return [];

  const monthIdx = columns.findIndex((c) => c === "month");
  const valueIdx = columns.findIndex((c) =>
    ["mau", "signups", "dau", "daily_users", "rate", "c"].includes(c),
  );
  const fallbackValueIdx = valueIdx >= 0 ? valueIdx : columns.length - 1;

  if (monthIdx < 0) return [];

  return results
    .map((row) => {
      const monthRaw = row[monthIdx];
      const valueRaw = row[fallbackValueIdx];
      if (typeof monthRaw !== "string") return null;
      return {
        month: monthRaw,
        value: Number(valueRaw ?? 0),
      };
    })
    .filter((row): row is HogQLQueryRow => row !== null);
}
