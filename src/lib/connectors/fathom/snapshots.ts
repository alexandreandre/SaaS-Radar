import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { FathomAggregationRow } from "@/lib/connectors/fathom/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";

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

/** Fathom limite les agrégations daily à 6 mois — découpe la plage en fenêtres. */
export function splitDateRangeForDailyQueries(dateFrom: string, dateTo: string): [string, string][] {
  const start = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [[dateFrom, dateTo]];
  }

  const windows: [string, string][] = [];
  let cursor = new Date(start);

  while (cursor <= end) {
    const windowStart = new Date(cursor);
    const windowEnd = new Date(cursor);
    windowEnd.setMonth(windowEnd.getMonth() + 6);
    windowEnd.setDate(0);

    if (windowEnd > end) {
      windows.push([formatDate(windowStart), formatDate(end)]);
      break;
    }

    windows.push([formatDate(windowStart), formatDate(windowEnd)]);
    cursor = new Date(windowEnd);
    cursor.setDate(cursor.getDate() + 1);
  }

  return windows.length > 0 ? windows : [[dateFrom, dateTo]];
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeMonthSegment(value: string): string {
  return value.slice(0, 7);
}

function rowDate(row: FathomAggregationRow): string | null {
  const raw = row.date ?? row.timestamp;
  if (!raw || typeof raw !== "string") return null;
  return normalizeMonthSegment(raw);
}

function parseMetricValue(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export function parseMonthlyVisits(rows: FathomAggregationRow[]): Map<string, number> {
  const byMonth = new Map<string, number>();

  for (const row of rows) {
    const month = rowDate(row);
    if (!month) continue;
    byMonth.set(month, parseMetricValue(row.visits));
  }

  return byMonth;
}

export function aggregateDailyVisitsToDau(rows: FathomAggregationRow[]): Map<string, number> {
  const dailyByMonth = new Map<string, number[]>();

  for (const row of rows) {
    const dayRaw = row.date ?? row.timestamp;
    if (!dayRaw || typeof dayRaw !== "string") continue;
    const month = normalizeMonthSegment(dayRaw);
    const visits = parseMetricValue(row.visits);
    const bucket = dailyByMonth.get(month) ?? [];
    bucket.push(visits);
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

export function parseMonthlySignups(rows: FathomAggregationRow[]): Map<string, number> {
  const byMonth = new Map<string, number>();

  for (const row of rows) {
    const month = rowDate(row);
    if (!month) continue;
    byMonth.set(month, parseMetricValue(row.unique_conversions));
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
    source: "fathom",
  };
}

export function buildSnapshotsFromAggregationResults(input: {
  monthKeys: string[];
  monthlyVisits: Map<string, number>;
  dauByMonth: Map<string, number>;
  signupsByMonth: Map<string, number>;
}): MetricsSnapshot[] {
  const { monthKeys, monthlyVisits, dauByMonth, signupsByMonth } = input;

  return monthKeys.map((date) => {
    const mau = monthlyVisits.get(date) ?? 0;
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
