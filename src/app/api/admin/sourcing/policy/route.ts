import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadPublishSettings,
  savePublishSettings,
  simulateRulesOnDrafts,
  type AutoPublishRule,
} from "@/lib/admin/publish-policy";
import type { DedupMatch } from "@/lib/admin/sourcing-dedup";
import type { Opportunity } from "@/types/opportunity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const settings = await loadPublishSettings();
  const admin = createAdminClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: runs } = await admin
    .from("sourcing_runs")
    .select("cost_usd")
    .gte("started_at", monthStart.toISOString());

  const monthCostUsd = (runs ?? []).reduce(
    (sum, r) => sum + (Number((r as { cost_usd?: number }).cost_usd) || 0),
    0
  );

  const costAlert =
    settings.monthly_cost_cap_usd != null &&
    monthCostUsd > settings.monthly_cost_cap_usd;

  return NextResponse.json({ settings, monthCostUsd, costAlert });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "editor", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const patch: Parameters<typeof savePublishSettings>[0] = {};

  if (typeof body.auto_publish_enabled === "boolean") {
    patch.auto_publish_enabled = body.auto_publish_enabled;
  }
  if (typeof body.notify_on_pending === "boolean") {
    patch.notify_on_pending = body.notify_on_pending;
  }
  if (body.auto_publish_rules != null) {
    patch.auto_publish_rules = body.auto_publish_rules as AutoPublishRule[];
  }
  if (body.monthly_cost_cap_usd !== undefined) {
    patch.monthly_cost_cap_usd =
      body.monthly_cost_cap_usd === null || body.monthly_cost_cap_usd === ""
        ? null
        : Number(body.monthly_cost_cap_usd);
  }
  if (body.default_mode === "draft" || body.default_mode === "direct") {
    patch.default_mode = body.default_mode;
  }

  try {
    const settings = await savePublishSettings(patch, auth.ctx.userId);
    await withAdminAudit(auth.ctx, {
      action: "sourcing.policy.update",
      targetType: "sourcing_settings",
      metadata: { default_mode: settings.default_mode, auto_publish_enabled: settings.auto_publish_enabled },
    });
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  if (body.action !== "simulate") {
    return NextResponse.json({ error: "action invalide" }, { status: 400 });
  }

  const settings = body.settings
    ? (body.settings as Awaited<ReturnType<typeof loadPublishSettings>>)
    : await loadPublishSettings();
  const runPremium = body.runPremium === true;

  const admin = createAdminClient();
  const { data: drafts } = await admin
    .from("opportunity_drafts")
    .select("payload, score, dedup_matches")
    .order("created_at", { ascending: false })
    .limit(200);

  const simulation = simulateRulesOnDrafts(
    (drafts ?? []).map((d) => ({
      payload: d.payload as Opportunity,
      score: d.score as number | null,
      dedup_matches: (d.dedup_matches ?? []) as DedupMatch[],
    })),
    settings,
    runPremium
  );

  return NextResponse.json({ simulation, settings });
}
