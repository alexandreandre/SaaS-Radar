import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("world_markets")
    .select("code, name, flag, heat_score")
    .order("heat_score", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ markets: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "editor", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { code, ...updates } = body as { code: string } & Record<string, unknown>;
  if (!code) return NextResponse.json({ error: "code requis" }, { status: 400 });

  const admin = createAdminClient();
  const { data: before } = await admin.from("world_markets").select("*").eq("code", code).maybeSingle();

  const { data, error } = await admin
    .from("world_markets")
    .upsert(
      {
        code,
        ...updates,
        is_manual_override: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" }
    )
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await withAdminAudit(auth.ctx, {
    action: "market.update",
    targetType: "world_market",
    targetId: code,
    beforeState: before,
    afterState: data,
  });

  return NextResponse.json({ market: data });
}
