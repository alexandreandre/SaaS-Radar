import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const [subs, campaigns] = await Promise.all([
    admin
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("newsletter_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const active = (subs.data ?? []).filter((s) => s.status === "active").length;
  const pending = (subs.data ?? []).filter((s) => s.status === "pending").length;

  return NextResponse.json({
    stats: { total: subs.data?.length ?? 0, active, pending },
    subscribers: subs.data ?? [],
    campaigns: campaigns.data ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "editor", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const admin = createAdminClient();

  if (body.type === "campaign") {
    const { data, error } = await admin
      .from("newsletter_campaigns")
      .insert({
        slug: body.slug,
        title: body.title,
        subject: body.subject,
        body_html: body.body_html ?? null,
        status: "draft",
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await withAdminAudit(auth.ctx, {
      action: "newsletter.campaign.create",
      targetType: "newsletter_campaign",
      targetId: data.id,
    });

    return NextResponse.json({ campaign: data });
  }

  return NextResponse.json({ error: "type invalide" }, { status: 400 });
}
