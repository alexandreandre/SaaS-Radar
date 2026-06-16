import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPublishSettings } from "@/lib/admin/publish-policy";
import { TERMINAL_RUN_STATUSES } from "@/lib/admin/sourcing-run-status";
import { getMetricsLast30Days } from "@/lib/sourcing/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  try {
    const admin = createAdminClient();
    const settings = await loadPublishSettings();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [pendingRes, lastRunRes, queuedRunsRes, monthRunsRes, metrics30d] = await Promise.all([
      admin
        .from("opportunity_drafts")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("sourcing_runs")
        .select("id, status, started_at, count_written, origin_country_code")
        .in("status", TERMINAL_RUN_STATUSES)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("sourcing_runs")
        .select("id", { count: "exact", head: true })
        .in("status", ["queued", "running"]),
      admin
        .from("sourcing_runs")
        .select("cost_usd, count_written")
        .gte("started_at", monthStart.toISOString()),
      getMetricsLast30Days(),
    ]);

    const monthCostUsd = (monthRunsRes.data ?? []).reduce(
      (sum, r) => sum + (Number((r as { cost_usd?: number }).cost_usd) || 0),
      0
    );
    const publishedThisMonth = (monthRunsRes.data ?? []).reduce(
      (sum, r) => sum + (Number((r as { count_written?: number }).count_written) || 0),
      0
    );

    const costAlert =
      settings.monthly_cost_cap_usd != null && monthCostUsd > settings.monthly_cost_cap_usd;

    const runsTotal30d = metrics30d.reduce((s, m) => s + m.runs_total, 0);
    const runsEmpty30d = metrics30d.reduce((s, m) => s + m.runs_empty, 0);
    const draftsWritten30d = metrics30d.reduce((s, m) => s + m.drafts_written, 0);
    const cost30d = metrics30d.reduce((s, m) => s + Number(m.cost_usd), 0);

    return NextResponse.json({
      pendingDrafts: pendingRes.count ?? 0,
      lastRun: lastRunRes.data ?? null,
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
        emptyRatePct:
          runsTotal30d > 0 ? Math.round((runsEmpty30d / runsTotal30d) * 100) : 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
