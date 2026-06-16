import { createClient } from "@supabase/supabase-js";
import type { RunReport } from "./logger";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function skipReasonCounts(skipped: RunReport["skipped"]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of skipped) {
    const key = s.reason.split(" ")[0].slice(0, 40);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export async function recordRunMetrics(
  report: RunReport,
  extras: { costUsd?: number; verifiedDrafts?: number }
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const day = new Date().toISOString().slice(0, 10);
  const { data: existing } = await admin
    .from("sourcing_metrics_daily")
    .select("*")
    .eq("day", day)
    .maybeSingle();

  const skipReasons = skipReasonCounts(report.skipped);
  const prevSkips = (existing?.skip_reasons as Record<string, number>) ?? {};
  const mergedSkips = { ...prevSkips };
  for (const [k, v] of Object.entries(skipReasons)) {
    mergedSkips[k] = (mergedSkips[k] ?? 0) + v;
  }

  const row = {
    day,
    runs_total: (existing?.runs_total ?? 0) + 1,
    runs_empty: (existing?.runs_empty ?? 0) + (report.status === "empty" ? 1 : 0),
    drafts_written: (existing?.drafts_written ?? 0) + report.written,
    drafts_verified: (existing?.drafts_verified ?? 0) + (extras.verifiedDrafts ?? 0),
    cost_usd: Number(existing?.cost_usd ?? 0) + (extras.costUsd ?? 0),
    skip_reasons: mergedSkips,
    updated_at: new Date().toISOString(),
  };

  await admin.from("sourcing_metrics_daily").upsert(row, { onConflict: "day" });
}

export async function getMetricsLast30Days(): Promise<
  Array<{
    day: string;
    runs_total: number;
    runs_empty: number;
    drafts_written: number;
    drafts_verified: number;
    cost_usd: number;
    skip_reasons: Record<string, number>;
  }>
> {
  const admin = createAdminClient();
  if (!admin) return [];

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await admin
    .from("sourcing_metrics_daily")
    .select("*")
    .gte("day", since)
    .order("day", { ascending: true });

  return (data ?? []) as Array<{
    day: string;
    runs_total: number;
    runs_empty: number;
    drafts_written: number;
    drafts_verified: number;
    cost_usd: number;
    skip_reasons: Record<string, number>;
  }>;
}
