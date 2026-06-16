import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_PRICING, type PaidPlan } from "@/lib/billing/plans";
import { listAuditLogs } from "@/lib/admin/audit";
import { loadPublishSettings } from "@/lib/admin/publish-policy";
import { TERMINAL_RUN_STATUSES } from "@/lib/admin/sourcing-run-status";
import { getMonthSourcingCostUsd } from "@/lib/sourcing/cost-guard";

function planMrrCents(plan: string, interval: string | null): number {
  if (plan !== "builder" && plan !== "pro") return 0;
  const paid = plan as PaidPlan;
  const pricing = PLAN_PRICING[paid];
  if (interval === "year") return Math.round((pricing.yearlyAmount * 100) / 12);
  return pricing.monthlyAmount * 100;
}

export type AdminHealthChecks = {
  supabase: boolean;
  stripe: boolean;
  openrouter: boolean;
  revalidate: boolean;
};

export type BillingMetrics = {
  mrrCents: number;
  arrCents: number;
  activeSubscribers: number;
  freeCount: number;
  builderCount: number;
  proCount: number;
  pastDueCount: number;
  totalUsers: number;
};

export type BillingSnapshot = {
  snapshot_date: string;
  mrr_cents: number;
  arr_cents: number;
  active_subscribers: number;
};

export type SourcingRunSummary = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  count_written: number;
  origin_country_code: string | null;
  cost_usd: number | null;
  error: string | null;
};

export type SourcingErrorSummary = {
  id: string;
  started_at: string;
  error: string | null;
};

export type AuditLogSummary = {
  id: string;
  actor_email: string | null;
  action: string;
  created_at: string;
};

export type SourcingMetrics7d = {
  runs_total: number;
  drafts_written: number;
  cost_usd: number;
};

export type AdminOverviewMetrics = {
  publishedOpportunities: number;
  pendingDrafts: number;
  draftsNeedingReview: number;
  totalUsers: number;
  newsletterSubscribers: number;
  lastRun: SourcingRunSummary | null;
  billing: BillingMetrics;
  billingHistory: BillingSnapshot[];
  healthChecks: AdminHealthChecks;
  recentSourcingErrors: SourcingErrorSummary[];
  activeRunsCount: number;
  sourcingCostMonthUsd: number;
  costAlert: boolean;
  recentAudit: AuditLogSummary[];
  sourcingMetrics7d: SourcingMetrics7d;
  loadedAt: string;
};

export function getAdminHealthChecks(): AdminHealthChecks {
  return {
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    revalidate: !!process.env.REVALIDATE_SECRET,
  };
}

export async function computeBillingMetrics(): Promise<BillingMetrics> {
  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("plan, subscription_status, billing_interval, stripe_price_id, created_at");

  if (error) throw new Error(error.message);

  let mrrCents = 0;
  let freeCount = 0;
  let builderCount = 0;
  let proCount = 0;
  let pastDueCount = 0;
  let activeSubscribers = 0;

  for (const p of profiles ?? []) {
    const plan = p.plan as string;
    const status = p.subscription_status as string | null;
    if (plan === "free") freeCount += 1;
    if (plan === "builder") builderCount += 1;
    if (plan === "pro") proCount += 1;
    if (status === "past_due") pastDueCount += 1;
    if (status === "active" || status === "trialing" || status === "past_due") {
      if (plan === "builder" || plan === "pro") {
        activeSubscribers += 1;
        mrrCents += planMrrCents(plan, p.billing_interval as string | null);
      }
    }
  }

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    activeSubscribers,
    freeCount,
    builderCount,
    proCount,
    pastDueCount,
    totalUsers: profiles?.length ?? 0,
  };
}

export async function createBillingSnapshot(): Promise<void> {
  const metrics = await computeBillingMetrics();
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  await admin.from("billing_snapshots").upsert(
    {
      snapshot_date: today,
      mrr_cents: metrics.mrrCents,
      arr_cents: metrics.arrCents,
      active_subscribers: metrics.activeSubscribers,
      free_count: metrics.freeCount,
      builder_count: metrics.builderCount,
      pro_count: metrics.proCount,
      past_due_count: metrics.pastDueCount,
      metadata: { total_users: metrics.totalUsers },
    },
    { onConflict: "snapshot_date" }
  );
}

export type UserPageStats = {
  totalUsers: number;
  activeAdmins: number;
  freeCount: number;
  builderCount: number;
  proCount: number;
  signupsLast7Days: number;
};

export async function computeUserPageStats(): Promise<UserPageStats> {
  const admin = createAdminClient();
  const billing = await computeBillingMetrics();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [adminsRes, recentRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .neq("admin_role", "none"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString()),
  ]);

  return {
    totalUsers: billing.totalUsers,
    activeAdmins: adminsRes.count ?? 0,
    freeCount: billing.freeCount,
    builderCount: billing.builderCount,
    proCount: billing.proCount,
    signupsLast7Days: recentRes.count ?? 0,
  };
}

async function getSourcingMetrics7d(): Promise<SourcingMetrics7d> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await admin
    .from("sourcing_metrics_daily")
    .select("runs_total, drafts_written, cost_usd")
    .gte("day", since);

  return (data ?? []).reduce<SourcingMetrics7d>(
    (acc, row) => ({
      runs_total: acc.runs_total + (Number(row.runs_total) || 0),
      drafts_written: acc.drafts_written + (Number(row.drafts_written) || 0),
      cost_usd: acc.cost_usd + (Number(row.cost_usd) || 0),
    }),
    { runs_total: 0, drafts_written: 0, cost_usd: 0 }
  );
}

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const admin = createAdminClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    opportunitiesRes,
    draftsRes,
    draftsReviewRes,
    usersRes,
    subscribersRes,
    runsRes,
    activeRunsRes,
    recentErrorsRes,
    billing,
    snapshotsRes,
    auditResult,
    sourcingMetrics7d,
    settings,
    monthCostUsd,
  ] = await Promise.all([
    admin.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin
      .from("opportunity_drafts")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("opportunity_drafts")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("needs_review", true),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("sourcing_runs")
      .select(
        "id, started_at, finished_at, status, count_written, origin_country_code, cost_usd, error"
      )
      .in("status", TERMINAL_RUN_STATUSES)
      .order("started_at", { ascending: false })
      .limit(1),
    admin
      .from("sourcing_runs")
      .select("id", { count: "exact", head: true })
      .in("status", ["queued", "running"]),
    admin
      .from("sourcing_runs")
      .select("id, started_at, error")
      .eq("status", "error")
      .gte("started_at", since24h)
      .order("started_at", { ascending: false })
      .limit(3),
    computeBillingMetrics(),
    admin
      .from("billing_snapshots")
      .select("snapshot_date, mrr_cents, arr_cents, active_subscribers")
      .order("snapshot_date", { ascending: false })
      .limit(30),
    listAuditLogs({ limit: 5 }),
    getSourcingMetrics7d(),
    loadPublishSettings(),
    getMonthSourcingCostUsd(),
  ]);

  const costAlert =
    settings.monthly_cost_cap_usd != null && monthCostUsd > settings.monthly_cost_cap_usd;

  const lastRunRow = runsRes.data?.[0];
  const lastRun: SourcingRunSummary | null = lastRunRow
    ? {
        id: lastRunRow.id as string,
        started_at: lastRunRow.started_at as string,
        finished_at: (lastRunRow.finished_at as string | null) ?? null,
        status: lastRunRow.status as string,
        count_written: Number(lastRunRow.count_written) || 0,
        origin_country_code: (lastRunRow.origin_country_code as string | null) ?? null,
        cost_usd: lastRunRow.cost_usd != null ? Number(lastRunRow.cost_usd) : null,
        error: (lastRunRow.error as string | null) ?? null,
      }
    : null;

  return {
    publishedOpportunities: opportunitiesRes.count ?? 0,
    pendingDrafts: draftsRes.count ?? 0,
    draftsNeedingReview: draftsReviewRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    newsletterSubscribers: subscribersRes.count ?? 0,
    lastRun,
    billing,
    billingHistory: (snapshotsRes.data ?? []) as BillingSnapshot[],
    healthChecks: getAdminHealthChecks(),
    recentSourcingErrors: (recentErrorsRes.data ?? []) as SourcingErrorSummary[],
    activeRunsCount: activeRunsRes.count ?? 0,
    sourcingCostMonthUsd: monthCostUsd,
    costAlert,
    recentAudit: (auditResult.logs as AuditLogSummary[]).map((log) => ({
      id: log.id,
      actor_email: log.actor_email ?? null,
      action: log.action,
      created_at: log.created_at,
    })),
    sourcingMetrics7d,
    loadedAt: new Date().toISOString(),
  };
}
