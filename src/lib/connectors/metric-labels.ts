import type { MetricKey } from "@/lib/connectors/types";

export const METRIC_LABELS: Record<MetricKey, string> = {
  mrr: "MRR",
  newMrr: "Nouveau MRR",
  expansionMrr: "Expansion",
  churnedMrr: "Churn",
  customers: "Clients",
  signups: "Inscriptions",
  trials: "Essais",
  activeUsers: "Utilisateurs",
  mau: "MAU",
  dau: "DAU",
  adSpend: "Budget pub",
  impressions: "Impressions",
  clicks: "Clics",
  conversions: "Conversions",
};

export function getMetricChips(provides: MetricKey[], max = 3): string[] {
  return provides.slice(0, max).map((key) => METRIC_LABELS[key] ?? key);
}
