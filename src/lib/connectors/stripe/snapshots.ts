import type { MetricsSnapshot } from "@/lib/connectors/types";
import { centsToEuros } from "@/lib/connectors/stripe/keys";

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
