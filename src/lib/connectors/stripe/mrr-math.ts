/** Calcul MRR normalisé (pur, testable). */

export type StripeRecurringPrice = {
  unit_amount: number | null;
  currency: string;
  recurring?: { interval: string; interval_count?: number } | null;
};

export function normalizePriceToMonthlyMrrCents(
  price: StripeRecurringPrice,
  quantity = 1,
): number {
  if (price.unit_amount == null || !price.recurring) return 0;

  const qty = quantity > 0 ? quantity : 1;
  const amount = price.unit_amount * qty;
  const intervalCount = price.recurring.interval_count ?? 1;

  switch (price.recurring.interval) {
    case "month":
      return Math.round(amount / intervalCount);
    case "year":
      return Math.round(amount / (12 * intervalCount));
    case "week":
      return Math.round((amount * 52) / (12 * intervalCount));
    case "day":
      return Math.round((amount * 365) / (12 * intervalCount));
    default:
      return 0;
  }
}

export function monthKeyFromUnix(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
