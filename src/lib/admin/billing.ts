import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeBillingMetrics } from "@/lib/admin/metrics";

export type AdminBillingData = {
  metrics: Awaited<ReturnType<typeof computeBillingMetrics>>;
  snapshots: Record<string, unknown>[];
  subscribers: Record<string, unknown>[];
};

export async function getAdminBillingData(): Promise<AdminBillingData> {
  const admin = createAdminClient();
  const [metrics, snapshotsRes, subscribersRes] = await Promise.all([
    computeBillingMetrics(),
    admin.from("billing_snapshots").select("*").order("snapshot_date", { ascending: false }).limit(30),
    admin
      .from("profiles")
      .select(
        "id, email, plan, subscription_status, billing_interval, current_period_end, stripe_customer_id, created_at"
      )
      .neq("plan", "free")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (snapshotsRes.error) throw new Error(snapshotsRes.error.message);
  if (subscribersRes.error) throw new Error(subscribersRes.error.message);

  return {
    metrics,
    snapshots: (snapshotsRes.data ?? []) as Record<string, unknown>[],
    subscribers: (subscribersRes.data ?? []) as Record<string, unknown>[],
  };
}
