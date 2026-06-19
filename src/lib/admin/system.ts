import "server-only";

import { getSupabaseUrl } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { recoverStaleRuns } from "@/lib/admin/sourcing-jobs";
import { getSourcingCostSummary } from "@/lib/admin/sourcing-page";
import { listAdminMarkets } from "@/lib/admin/markets";

export type AdminSystemData = {
  checks: Record<string, boolean>;
  recoveredStaleRuns: number;
  recentErrors: Record<string, unknown>[];
  schedules: Record<string, unknown>[];
};

export function getSystemChecks() {
  return {
    supabase: !!getSupabaseUrl() && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    googleAds: !!(
      process.env.GOOGLE_ADS_CLIENT_ID?.trim() &&
      process.env.GOOGLE_ADS_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_ADS_REDIRECT_URI?.trim() &&
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim()
    ),
    metaAds: !!(
      process.env.META_ADS_CLIENT_ID?.trim() &&
      process.env.META_ADS_CLIENT_SECRET?.trim() &&
      process.env.META_ADS_REDIRECT_URI?.trim()
    ),
    credentialsEncryption: !!process.env.CREDENTIALS_ENCRYPTION_KEY?.trim(),
    openrouter: !!process.env.OPENROUTER_API_KEY,
    revalidate: !!process.env.REVALIDATE_SECRET,
  };
}

export async function getAdminSystemData(): Promise<AdminSystemData> {
  const admin = createAdminClient();
  const recovered = await recoverStaleRuns();

  const [recentErrorsRes, schedulesRes] = await Promise.all([
    admin
      .from("sourcing_runs")
      .select("id, started_at, error")
      .eq("status", "error")
      .order("started_at", { ascending: false })
      .limit(5),
    admin.from("sourcing_schedules").select("*").limit(5),
  ]);

  if (recentErrorsRes.error) throw new Error(recentErrorsRes.error.message);
  if (schedulesRes.error) throw new Error(schedulesRes.error.message);

  return {
    checks: getSystemChecks(),
    recoveredStaleRuns: recovered,
    recentErrors: (recentErrorsRes.data ?? []) as Record<string, unknown>[],
    schedules: (schedulesRes.data ?? []) as Record<string, unknown>[],
  };
}

export async function getAdminSystemPageData() {
  const [system, costSummary, markets] = await Promise.all([
    getAdminSystemData(),
    getSourcingCostSummary(),
    listAdminMarkets(),
  ]);
  return {
    ...system,
    monthCostUsd: costSummary.monthCostUsd,
    costAlert: costSummary.costAlert,
    settings: costSummary.settings,
    markets,
  };
}

export type AdminSystemPageData = Awaited<ReturnType<typeof getAdminSystemPageData>>;
