import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import { billingCycleToMonthlyMrr, parseAmount } from "@/lib/connectors/freemius/keys";
import type { FreemiusSubscriptionRecord } from "@/lib/connectors/freemius/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function parseFreemiusDate(iso: string): Date {
  const normalized = iso.includes("T") ? iso : iso.replace(" ", "T") + "Z";
  return new Date(normalized);
}

export function endOfMonthUtc(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year!, month!, 0, 23, 59, 59, 999));
}

export function monthKeyFromFreemiusDate(iso: string): string {
  const d = parseFreemiusDate(iso);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getSubscriptionMrr(sub: FreemiusSubscriptionRecord): number {
  const renewal = parseAmount(sub.renewal_amount) || parseAmount(sub.amount_per_cycle);
  return billingCycleToMonthlyMrr(renewal, sub.billing_cycle);
}

export function isInTrialAt(sub: FreemiusSubscriptionRecord, instant: Date): boolean {
  if (!sub.trial_ends) return false;
  const trialEnds = parseFreemiusDate(sub.trial_ends);
  return trialEnds > instant;
}

export function isSubscriptionActiveAt(
  sub: FreemiusSubscriptionRecord,
  instant: Date,
): boolean {
  if (sub.billing_cycle <= 0) return false;

  const created = parseFreemiusDate(sub.created);
  if (created > instant) return false;

  if (sub.canceled_at) {
    const canceled = parseFreemiusDate(sub.canceled_at);
    if (canceled <= instant) return false;
  } else if (!sub.next_payment) {
    return false;
  }

  if (isInTrialAt(sub, instant)) return false;

  return true;
}

export function buildSnapshotsFromSubscriptions(
  subscriptions: FreemiusSubscriptionRecord[],
  monthKeys: string[],
): MetricsSnapshot[] {
  const mrrBySub = new Map<string, number>();
  for (const sub of subscriptions) {
    mrrBySub.set(sub.id, getSubscriptionMrr(sub));
  }

  return monthKeys.map((date) => {
    const instant = endOfMonthUtc(date);
    let mrr = 0;
    let newMrr = 0;
    let churnedMrr = 0;
    const activeCustomers = new Set<string>();

    for (const sub of subscriptions) {
      const mrrSub = mrrBySub.get(sub.id) ?? 0;

      if (isSubscriptionActiveAt(sub, instant)) {
        mrr += mrrSub;
        activeCustomers.add(sub.user_id);
      }

      if (monthKeyFromFreemiusDate(sub.created) === date) {
        newMrr += mrrSub;
      }

      if (sub.canceled_at && monthKeyFromFreemiusDate(sub.canceled_at) === date) {
        churnedMrr += mrrSub;
      }
    }

    return {
      date,
      mrr,
      newMrr,
      expansionMrr: 0,
      churnedMrr,
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
      source: "freemius" as const,
    };
  });
}
