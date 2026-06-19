import {
  buildDateRangeForMonths,
  getMonthKeys,
  normalizeMonthSegment,
} from "@/lib/connectors/plausible/snapshots";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { SegmentationQueryResponse } from "@/lib/connectors/mixpanel/types";

export { buildDateRangeForMonths, getMonthKeys };

export function parseSegmentationMonthlyValues(
  response: SegmentationQueryResponse,
  eventName?: string,
): Map<string, number> {
  const byMonth = new Map<string, number>();
  const values = response.data?.values;
  if (!values) return byMonth;

  const eventKey =
    (eventName && values[eventName] ? eventName : undefined) ??
    Object.keys(values)[0];
  if (!eventKey) return byMonth;

  const eventValues = values[eventKey] ?? {};
  for (const [date, count] of Object.entries(eventValues)) {
    const month = normalizeMonthSegment(date);
    byMonth.set(month, Math.max(0, Math.round(Number(count ?? 0))));
  }

  return byMonth;
}

export function aggregateDailySegmentationToDau(
  response: SegmentationQueryResponse,
  eventName?: string,
): Map<string, number> {
  const values = response.data?.values;
  if (!values) return new Map();

  const eventKey =
    (eventName && values[eventName] ? eventName : undefined) ??
    Object.keys(values)[0];
  if (!eventKey) return new Map();

  const dailyByMonth = new Map<string, number[]>();
  const eventValues = values[eventKey] ?? {};

  for (const [date, count] of Object.entries(eventValues)) {
    const month = normalizeMonthSegment(date);
    const visitors = Math.max(0, Number(count ?? 0));
    const bucket = dailyByMonth.get(month) ?? [];
    bucket.push(visitors);
    dailyByMonth.set(month, bucket);
  }

  const dauByMonth = new Map<string, number>();
  dailyByMonth.forEach((dayValues, month) => {
    if (dayValues.length === 0) {
      dauByMonth.set(month, 0);
      return;
    }
    const avg = dayValues.reduce((sum, value) => sum + value, 0) / dayValues.length;
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
    source: "mixpanel",
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
