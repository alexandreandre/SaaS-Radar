import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type {
  LemonSqueezyPriceAttributes,
  LemonSqueezySubscriptionRecord,
} from "@/lib/connectors/lemon-squeezy/types";
import { centsToMajorUnit } from "@/lib/connectors/lemon-squeezy/keys";
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

export function normalizePriceToMonthlyMrrCents(
  price: LemonSqueezyPriceAttributes,
  quantity: number,
): number {
  if (price.category !== "subscription") return 0;
  if (price.usage_aggregation) return 0;
  if (price.scheme === "graduated" || price.scheme === "volume") return 0;

  let unitCents = price.unit_price;
  if (unitCents == null && price.unit_price_decimal) {
    unitCents = Math.round(parseFloat(price.unit_price_decimal));
  }
  if (!unitCents || unitCents <= 0) return 0;

  const qty = Math.max(1, quantity);
  const amount = unitCents * qty;
  const intervalUnit = price.renewal_interval_unit;
  const intervalQty = price.renewal_interval_quantity ?? 1;
  if (!intervalUnit) return 0;

  switch (intervalUnit) {
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

export function isSubscriptionActiveAt(
  sub: LemonSqueezySubscriptionRecord,
  instant: Date,
): boolean {
  const created = new Date(sub.attributes.created_at);
  if (created > instant) return false;

  if (sub.attributes.ends_at) {
    const ends = new Date(sub.attributes.ends_at);
    if (ends <= instant) return false;
  } else if (sub.attributes.status === "expired" || sub.attributes.status === "unpaid") {
    return false;
  }

  return true;
}

export function getSubscriptionMrrCents(
  sub: LemonSqueezySubscriptionRecord,
  priceMap: Map<string, LemonSqueezyPriceAttributes>,
): number {
  const item = sub.attributes.first_subscription_item;
  if (!item?.price_id) return 0;

  const price = priceMap.get(String(item.price_id));
  if (!price) return 0;

  return normalizePriceToMonthlyMrrCents(price, item.quantity);
}

export function buildSnapshotsFromSubscriptions(
  subscriptions: LemonSqueezySubscriptionRecord[],
  priceMap: Map<string, LemonSqueezyPriceAttributes>,
  monthKeys: string[],
): MetricsSnapshot[] {
  const mrrBySub = new Map<string, number>();
  for (const sub of subscriptions) {
    mrrBySub.set(sub.id, getSubscriptionMrrCents(sub, priceMap));
  }

  return monthKeys.map((date) => {
    const instant = endOfMonthUtc(date);
    let mrrCents = 0;
    let newMrrCents = 0;
    let churnedMrrCents = 0;
    const activeCustomers = new Set<number>();

    for (const sub of subscriptions) {
      const mrrCentsSub = mrrBySub.get(sub.id) ?? 0;

      if (isSubscriptionActiveAt(sub, instant)) {
        mrrCents += mrrCentsSub;
        activeCustomers.add(sub.attributes.customer_id);
      }

      if (monthKeyFromIso(sub.attributes.created_at) === date) {
        newMrrCents += mrrCentsSub;
      }

      if (sub.attributes.ends_at && monthKeyFromIso(sub.attributes.ends_at) === date) {
        churnedMrrCents += mrrCentsSub;
      }
    }

    const mrr = centsToMajorUnit(mrrCents);

    return {
      date,
      mrr,
      newMrr: centsToMajorUnit(newMrrCents),
      expansionMrr: 0,
      churnedMrr: centsToMajorUnit(churnedMrrCents),
      customers: activeCustomers.size,
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
      source: "lemon-squeezy" as const,
    };
  });
}
