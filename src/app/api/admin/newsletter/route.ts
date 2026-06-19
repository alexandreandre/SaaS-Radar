import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminNewsletterData } from "@/lib/admin/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;
  try {
    const payload = await getAdminNewsletterData();
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
