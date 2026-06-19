import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { promoteWeeklyPick, revalidateOpportunitiesCache } from "@/lib/admin/weekly-pick";
import { listAdminOpportunities } from "@/lib/admin/opportunities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "published";
  const q = url.searchParams.get("q")?.trim();
  const sector = url.searchParams.get("sector");
  const country = url.searchParams.get("country");
  const minScoreRaw = url.searchParams.get("minScore");
  const sort = url.searchParams.get("sort") ?? "newest";
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
  const minScore = minScoreRaw ? parseInt(minScoreRaw, 10) : null;

  try {
    const payload = await listAdminOpportunities({
      status,
      q,
      sector,
      country,
      minScore,
      sort,
      limit,
      offset,
    });
    return NextResponse.json(payload);
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
  const { slug, ...updates } = body as { slug: string } & Record<string, unknown>;
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const admin = createAdminClient();
  const { data: before } = await admin.from("opportunities").select("*").eq("slug", slug).maybeSingle();

  if (updates.weekly_pick === true) {
    await promoteWeeklyPick(slug);
    const { data: after } = await admin.from("opportunities").select("*").eq("slug", slug).maybeSingle();
    revalidateOpportunitiesCache();
    await withAdminAudit(auth.ctx, {
      action: "opportunity.update",
      targetType: "opportunity",
      targetId: slug,
      beforeState: before,
      afterState: after,
    });
    return NextResponse.json({ opportunity: after });
  }

  const patchPayload = {
    ...updates,
    ...(updates.status === "published" ? { published_at: new Date().toISOString() } : {}),
  };

  const { data, error } = await admin
    .from("opportunities")
    .update(patchPayload)
    .eq("slug", slug)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateOpportunitiesCache();

  await withAdminAudit(auth.ctx, {
    action: "opportunity.update",
    targetType: "opportunity",
    targetId: slug,
    beforeState: before,
    afterState: data,
  });

  return NextResponse.json({ opportunity: data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "editor", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const admin = createAdminClient();
  const { data: before } = await admin.from("opportunities").select("*").eq("slug", slug).maybeSingle();

  const { error } = await admin.from("opportunities").update({ status: "archived" }).eq("slug", slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateOpportunitiesCache();

  await withAdminAudit(auth.ctx, {
    action: "opportunity.archive",
    targetType: "opportunity",
    targetId: slug,
    beforeState: before,
  });

  return NextResponse.json({ ok: true });
}
