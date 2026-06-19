import type { MetricsSnapshot } from "@/lib/connectors/types";
import { centsToEuros } from "@/lib/connectors/stripe/keys";
import {
  computeDeltasFromLastSnapshot,
  type LastSnapshotMeta,
  type MonthlyGrowth,
} from "@/lib/connectors/stripe/errors";

function getGrowthValue(
  growth: Map<string, Map<string, number>>,
  month: string,
  type: string,
): number {
  return Math.abs(growth.get(month)?.get(type) ?? 0);
}

export function buildSnapshotsFromAnalytics(
  mrrSeries: Map<string, number>,
  growth: Map<string, Map<string, number>>,
  monthKeys: string[],
  activeCustomers: number,
): MetricsSnapshot[] {
  const latestMonth = monthKeys.at(-1);
  const latestMrrCents = latestMonth ? mrrSeries.get(latestMonth) ?? 0 : 0;
  const arpu =
    activeCustomers > 0 && latestMrrCents > 0
      ? centsToEuros(latestMrrCents) / activeCustomers
      : 0;

  return monthKeys.map((date) => {
    const mrrCents = mrrSeries.get(date) ?? 0;
    const mrr = centsToEuros(mrrCents);
    const newCents =
      getGrowthValue(growth, date, "new") + getGrowthValue(growth, date, "reactivation");
    const expansionCents = getGrowthValue(growth, date, "expansion");
    const churnCents = getGrowthValue(growth, date, "churn");

    const customers =
      date === latestMonth && activeCustomers > 0
        ? activeCustomers
        : arpu > 0
          ? Math.max(0, Math.round(mrr / arpu))
          : mrr > 0
            ? 1
            : 0;

    return {
      date,
      mrr,
      newMrr: centsToEuros(newCents),
      expansionMrr: centsToEuros(expansionCents),
      churnedMrr: centsToEuros(churnCents),
      customers,
      arr: mrr * 12,
      signups: 0,
      trials: 0,
      activeUsers: 0,
      mau: 0,
      dau: 0,
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      source: "stripe" as const,
    };
  });
}

export type BuildSnapshotsFromV1Options = {
  currentMrr: number;
  activeCustomers: number;
  monthKeys: string[];
  invoiceMrrByMonth?: Map<string, number>;
  subscriptionGrowthByMonth?: Map<string, MonthlyGrowth>;
  lastSnapshot?: LastSnapshotMeta;
};

function emptySnapshot(date: string): MetricsSnapshot {
  return {
    date,
    mrr: 0,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    customers: 0,
    arr: 0,
    signups: 0,
    trials: 0,
    activeUsers: 0,
    mau: 0,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    source: "stripe" as const,
  };
}

export function buildSnapshotsFromV1(options: BuildSnapshotsFromV1Options): MetricsSnapshot[] {
  const {
    currentMrr,
    activeCustomers,
    monthKeys,
    invoiceMrrByMonth,
    subscriptionGrowthByMonth,
    lastSnapshot,
  } = options;

  const latestMonth = monthKeys.at(-1);
  const syncDeltas = computeDeltasFromLastSnapshot(
    { mrr: currentMrr, customers: activeCustomers },
    lastSnapshot,
  );

  return monthKeys.map((date) => {
    const isLatest = date === latestMonth;
    const invoiceMrr = invoiceMrrByMonth?.get(date) ?? 0;
    const mrr = isLatest ? currentMrr : invoiceMrr > 0 ? invoiceMrr : 0;

    const eventGrowth = subscriptionGrowthByMonth?.get(date);
    let newMrr = eventGrowth?.newMrr ?? 0;
    let expansionMrr = eventGrowth?.expansionMrr ?? 0;
    let churnedMrr = eventGrowth?.churnedMrr ?? 0;

    if (isLatest && !eventGrowth?.newMrr && !eventGrowth?.churnedMrr) {
      newMrr = syncDeltas.newMrr;
      expansionMrr = syncDeltas.expansionMrr;
      churnedMrr = syncDeltas.churnedMrr;
    }

    const customers = isLatest ? activeCustomers : mrr > 0 ? 0 : 0;

    return {
      ...emptySnapshot(date),
      mrr,
      newMrr,
      expansionMrr,
      churnedMrr,
      customers,
      arr: mrr * 12,
    };
  });
}
