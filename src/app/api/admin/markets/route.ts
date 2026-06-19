import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAdminMarkets } from "@/lib/admin/markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;
  try {
    const markets = await listAdminMarkets();
    return NextResponse.json({ markets });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
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
