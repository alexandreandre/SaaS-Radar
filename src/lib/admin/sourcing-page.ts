import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { loadPublishSettings, type SourcingSettings } from "@/lib/admin/publish-policy";
import { TERMINAL_RUN_STATUSES } from "@/lib/admin/sourcing-run-status";
import { getMetricsLast30Days } from "@/lib/sourcing/metrics";
import { listActiveSourcingRuns, listSourcingRuns, recoverStaleRuns } from "@/lib/admin/sourcing-jobs";
import { recoverStuckQueueJobs } from "@/lib/admin/process-sourcing-queue";
import { listAdminMarkets } from "@/lib/admin/markets";

export type AdminSourcingSummary = {
  pendingDrafts: number;
  lastRun: {
    id?: string;
    status?: string;
    started_at?: string;
    count_written?: number;
    origin_country_code?: string | null;
  } | null;
  queuedRunsCount: number;
  monthCostUsd: number;
  publishedThisMonth: number;
  monthlyCostCapUsd: number | null;
  costAlert: boolean;
  metrics30d: {
    runsTotal: number;
    runsEmpty: number;
    draftsWritten: number;
    costUsd: number;
    emptyRatePct: number;
  };
};

export async function getSourcingCostSummary() {
  const settings = await loadPublishSettings();
  const admin = createAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data, error } = await admin
    .from("sourcing_runs")
    .select("cost_usd")
    .gte("started_at", monthStart.toISOString());
  if (error) throw new Error(error.message);

  const monthCostUsd = (data ?? []).reduce(
    (sum, row) => sum + (Number((row as { cost_usd?: number }).cost_usd) || 0),
    0
  );
  const costAlert =
    settings.monthly_cost_cap_usd != null && monthCostUsd > settings.monthly_cost_cap_usd;

  return { settings, monthCostUsd, costAlert };
}

export async function getAdminSourcingSummary(): Promise<AdminSourcingSummary> {
  const admin = createAdminClient();
  const { settings } = await getSourcingCostSummary();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [pendingRes, lastRunRes, queuedRunsRes, monthRunsRes, metrics30d] = await Promise.all([
    admin.from("opportunity_drafts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin
      .from("sourcing_runs")
      .select("id, status, started_at, count_written, origin_country_code")
      .in("status", TERMINAL_RUN_STATUSES)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("sourcing_runs").select("id", { count: "exact", head: true }).in("status", ["queued", "running"]),
    admin.from("sourcing_runs").select("cost_usd, count_written").gte("started_at", monthStart.toISOString()),
    getMetricsLast30Days(),
  ]);
  if (pendingRes.error) throw new Error(pendingRes.error.message);
  if (lastRunRes.error) throw new Error(lastRunRes.error.message);
  if (queuedRunsRes.error) throw new Error(queuedRunsRes.error.message);
  if (monthRunsRes.error) throw new Error(monthRunsRes.error.message);

  const monthCostUsd = (monthRunsRes.data ?? []).reduce(
    (sum, row) => sum + (Number((row as { cost_usd?: number }).cost_usd) || 0),
    0
  );
  const publishedThisMonth = (monthRunsRes.data ?? []).reduce(
    (sum, row) => sum + (Number((row as { count_written?: number }).count_written) || 0),
    0
  );
  const costAlert =
    settings.monthly_cost_cap_usd != null && monthCostUsd > settings.monthly_cost_cap_usd;

  const runsTotal30d = metrics30d.reduce((sum, m) => sum + m.runs_total, 0);
  const runsEmpty30d = metrics30d.reduce((sum, m) => sum + m.runs_empty, 0);
  const draftsWritten30d = metrics30d.reduce((sum, m) => sum + m.drafts_written, 0);
  const cost30d = metrics30d.reduce((sum, m) => sum + Number(m.cost_usd), 0);

  return {
    pendingDrafts: pendingRes.count ?? 0,
    lastRun: (lastRunRes.data as AdminSourcingSummary["lastRun"]) ?? null,
    queuedRunsCount: queuedRunsRes.count ?? 0,
    monthCostUsd,
    publishedThisMonth,
    monthlyCostCapUsd: settings.monthly_cost_cap_usd,
    costAlert,
    metrics30d: {
      runsTotal: runsTotal30d,
      runsEmpty: runsEmpty30d,
      draftsWritten: draftsWritten30d,
      costUsd: cost30d,
      emptyRatePct: runsTotal30d > 0 ? Math.round((runsEmpty30d / runsTotal30d) * 100) : 0,
    },
  };
}

export type AdminSourcingConsoleData = {
  runs: Awaited<ReturnType<typeof listSourcingRuns>>;
  activeRuns: Awaited<ReturnType<typeof listActiveSourcingRuns>>;
  settings: SourcingSettings;
  summary: AdminSourcingSummary;
  markets: Record<string, unknown>[];
};

export async function getAdminSourcingConsoleData(): Promise<AdminSourcingConsoleData> {
  await recoverStaleRuns();
  await recoverStuckQueueJobs();
  const [runs, activeRuns, settings, summary, markets] = await Promise.all([
    listSourcingRuns(20),
    listActiveSourcingRuns(),
    loadPublishSettings(),
    getAdminSourcingSummary(),
    listAdminMarkets(),
  ]);

  return { runs, activeRuns, settings, summary, markets };
}
