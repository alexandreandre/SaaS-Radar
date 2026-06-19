import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import { minorUnitToMajor, parseMinorAmount } from "@/lib/connectors/paddle/keys";
import type {
  PaddleMetricsDatapoint,
  PaddlePrice,
  PaddleSubscriptionRecord,
} from "@/lib/connectors/paddle/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function endOfMonthUtc(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year!, month!, 0, 23, 59, 59, 999));
}

export function monthKeyFromIso(iso: string): string {
  return iso.slice(0, 7);
}

export function normalizePriceToMonthlyMrrMinor(
  price: PaddlePrice,
  quantity: number,
): number {
  if (!price.billing_cycle) return 0;

  const unitMinor = parseMinorAmount(price.unit_price.amount);
  if (unitMinor <= 0) return 0;

  const qty = Math.max(1, quantity);
  const amount = unitMinor * qty;
  const { interval, frequency } = price.billing_cycle;
  const intervalQty = Math.max(1, frequency);

  switch (interval) {
    case "month":
      return Math.round(amount / intervalQty);
    case "year":
      return Math.round(amount / (12 * intervalQty));
    case "week":
      return Math.round((amount * 52) / (12 * intervalQty));
    case "day":
      return Math.round((amount * 365) / (12 * intervalQty));
    default:
      return 0;
  }
}

export function getSubscriptionMrrMinor(sub: PaddleSubscriptionRecord): number {
  let total = 0;
  for (const item of sub.attributes.items ?? []) {
    if (!item.recurring || item.status === "inactive") continue;
    total += normalizePriceToMonthlyMrrMinor(item.price, item.quantity);
  }
  return total;
}

export function isSubscriptionActiveAt(
  sub: PaddleSubscriptionRecord,
  instant: Date,
): boolean {
  const started = sub.attributes.started_at ?? sub.attributes.created_at;
  if (!started || new Date(started) > instant) return false;

  if (sub.attributes.canceled_at) {
    const canceled = new Date(sub.attributes.canceled_at);
    if (canceled <= instant) return false;
  } else if (sub.attributes.status === "canceled") {
    return false;
  }

  if (sub.attributes.status === "paused" && sub.attributes.paused_at) {
    const paused = new Date(sub.attributes.paused_at);
    if (paused <= instant) return false;
  }

  return sub.attributes.status !== "canceled";
}

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
    source: "paddle",
  };
}

function lastDatapointInMonth(
  timeseries: PaddleMetricsDatapoint[],
  monthKey: string,
): PaddleMetricsDatapoint | undefined {
  const prefix = `${monthKey}-`;
  let last: PaddleMetricsDatapoint | undefined;
  for (const point of timeseries) {
    if (point.timestamp.startsWith(prefix)) {
      last = point;
    }
  }
  return last;
}

export function buildSnapshotsFromMetrics(
  mrrSeries: PaddleMetricsDatapoint[],
  subscriberSeries: PaddleMetricsDatapoint[],
  monthKeys: string[],
): MetricsSnapshot[] {
  return monthKeys.map((date) => {
    const mrrPoint = lastDatapointInMonth(mrrSeries, date);
    const subPoint = lastDatapointInMonth(subscriberSeries, date);
    const mrr = minorUnitToMajor(parseMinorAmount(mrrPoint?.amount));

    return {
      ...emptySnapshot(date),
      mrr,
      customers: subPoint?.count ?? 0,
      arr: mrr * 12,
    };
  });
}

export function buildSnapshotsFromSubscriptions(
  subscriptions: PaddleSubscriptionRecord[],
  monthKeys: string[],
): MetricsSnapshot[] {
  const mrrBySub = new Map<string, number>();
  for (const sub of subscriptions) {
    mrrBySub.set(sub.id, getSubscriptionMrrMinor(sub));
  }

  return monthKeys.map((date) => {
    const instant = endOfMonthUtc(date);
    let mrrMinor = 0;
    let newMrrMinor = 0;
    let churnedMrrMinor = 0;
    const activeCustomers = new Set<string>();

    for (const sub of subscriptions) {
      const mrrMinorSub = mrrBySub.get(sub.id) ?? 0;
      const newDate =
        sub.attributes.first_billed_at ??
        sub.attributes.started_at ??
        sub.attributes.created_at;

      if (isSubscriptionActiveAt(sub, instant)) {
        mrrMinor += mrrMinorSub;
        activeCustomers.add(sub.attributes.customer_id);
      }

      if (newDate && monthKeyFromIso(newDate) === date) {
        newMrrMinor += mrrMinorSub;
      }

      if (sub.attributes.canceled_at && monthKeyFromIso(sub.attributes.canceled_at) === date) {
        churnedMrrMinor += mrrMinorSub;
      }
    }

    const mrr = minorUnitToMajor(mrrMinor);

    return {
      ...emptySnapshot(date),
      mrr,
      newMrr: minorUnitToMajor(newMrrMinor),
      churnedMrr: minorUnitToMajor(churnedMrrMinor),
      customers: activeCustomers.size,
      arr: mrr * 12,
    };
  });
}

export function mergeMetricAndSubscriptionSnapshots(
  metricsSnapshots: MetricsSnapshot[],
  subscriptionSnapshots: MetricsSnapshot[],
): MetricsSnapshot[] {
  const subByMonth = new Map(subscriptionSnapshots.map((s) => [s.date, s]));

  return metricsSnapshots.map((metricSnap) => {
    const subSnap = subByMonth.get(metricSnap.date);
    if (!subSnap) return metricSnap;

    return {
      ...metricSnap,
      newMrr: subSnap.newMrr,
      churnedMrr: subSnap.churnedMrr,
    };
  });
}

export function metricsDateRange(monthKeys: string[]): { from: string; to: string } {
  const from = `${monthKeys[0]!}-01`;
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}
