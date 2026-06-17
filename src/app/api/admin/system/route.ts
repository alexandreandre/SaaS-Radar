import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPPORTUNITIES_CACHE_TAG } from "@/lib/opportunities";
import { recoverStaleRuns } from "@/lib/admin/sourcing-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const recovered = await recoverStaleRuns();

  const checks = {
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    revalidate: !!process.env.REVALIDATE_SECRET,
  };

  const { data: recentErrors } = await admin
    .from("sourcing_runs")
    .select("id, started_at, error")
    .eq("status", "error")
    .order("started_at", { ascending: false })
    .limit(5);

  const { data: schedules } = await admin.from("sourcing_schedules").select("*").limit(5);

  return NextResponse.json({
    checks,
    recoveredStaleRuns: recovered,
    recentErrors: recentErrors ?? [],
    schedules: schedules ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "editor", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();

  if (body.action === "revalidate") {
    revalidatePath("/");
    revalidateTag(OPPORTUNITIES_CACHE_TAG);
    revalidatePath("/opportunities", "page");
    await withAdminAudit(auth.ctx, { action: "system.revalidate", targetType: "cache" });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update_schedule") {
    const admin = createAdminClient();
    const countryCodes = Array.isArray(body.country_codes)
      ? (body.country_codes as string[]).map((c) => String(c).toUpperCase())
      : undefined;

    const { data, error } = await admin
      .from("sourcing_schedules")
      .update({
        enabled: body.enabled,
        cron_expr: body.cron_expr,
        count: body.count,
        sector: body.sector ?? null,
        premium: true,
        min_score: body.min_score ?? null,
        ...(countryCodes ? { country_codes: countryCodes } : {}),
        ...(body.config != null ? { config: body.config } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await withAdminAudit(auth.ctx, {
      action: "sourcing.schedule.update",
      targetType: "sourcing_schedule",
      targetId: body.id,
      afterState: data,
    });

    return NextResponse.json({ schedule: data });
  }

  return NextResponse.json({ error: "action invalide" }, { status: 400 });
}
