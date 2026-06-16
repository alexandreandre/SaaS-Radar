import { createClient } from "@supabase/supabase-js";
import { loadPublishSettings } from "@/lib/admin/publish-policy";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis");
  }
  return createClient(url, key);
}

/** Somme cost_usd des runs du mois calendaire en cours. */
export async function getMonthSourcingCostUsd(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data, error } = await admin
    .from("sourcing_runs")
    .select("cost_usd")
    .gte("started_at", start);
  if (error) return 0;
  return (data ?? []).reduce((sum, row) => sum + (Number(row.cost_usd) || 0), 0);
}

export class CostCapExceededError extends Error {
  constructor(
    public readonly monthCostUsd: number,
    public readonly capUsd: number
  ) {
    super(
      `Plafond mensuel sourcing atteint : $${monthCostUsd.toFixed(2)} / $${capUsd.toFixed(2)} USD`
    );
    this.name = "CostCapExceededError";
  }
}

/** Lève si monthly_cost_cap_usd est configuré et dépassé. */
export async function assertWithinMonthlyCostCap(): Promise<void> {
  const settings = await loadPublishSettings();
  const cap = settings.monthly_cost_cap_usd;
  if (cap == null || cap <= 0) return;
  const monthCost = await getMonthSourcingCostUsd();
  if (monthCost >= cap) {
    throw new CostCapExceededError(monthCost, cap);
  }
}
