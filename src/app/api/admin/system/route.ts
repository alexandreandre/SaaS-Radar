import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPPORTUNITIES_CACHE_TAG } from "@/lib/opportunities";
import { getAdminSystemData } from "@/lib/admin/system";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;
  try {
    const payload = await getAdminSystemData();
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
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
