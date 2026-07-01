import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminNewsletterData } from "@/lib/admin/newsletter";
import { runWeeklySend } from "@/lib/newsletter/weekly-sender";

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

  if (body.type === "subscriber") {
    const inputEmails: string[] = Array.isArray(body.emails)
      ? body.emails.filter((value: unknown): value is string => typeof value === "string")
      : typeof body.email === "string"
        ? body.email.split(/[\s,;]+/)
        : [];
    const emails: string[] = Array.from(
      new Set(
        inputEmails
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      )
    );
    const source: string =
      typeof body.source === "string" && body.source.trim()
        ? body.source.trim()
        : "admin";

    if (
      emails.length === 0 ||
      emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const rows = emails.map((email) => ({
      email,
      source,
      status: "active",
      confirmed_at: now,
      unsubscribed_at: null,
      updated_at: now,
    }));

    const { data, error } = await admin
      .from("newsletter_subscribers")
      .upsert(rows, { onConflict: "email" })
      .select("id,email,status,source,confirmed_at,created_at,unsubscribed_at,updated_at")
      .returns<
        {
          id: string;
          email: string;
          status: string;
          source: string | null;
          confirmed_at: string | null;
          created_at: string;
          unsubscribed_at: string | null;
          updated_at: string;
        }[]
      >();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await withAdminAudit(auth.ctx, {
      action: "newsletter.subscriber.upsert",
      targetType: "newsletter_subscriber",
      targetId: data?.[0]?.id ?? null,
      metadata: { emails, source, count: data?.length ?? emails.length },
    });

    return NextResponse.json({ subscribers: data ?? [], count: data?.length ?? emails.length });
  }

  if (body.type === "manual_send") {
    const inputEmails: string[] = Array.isArray(body.emails)
      ? body.emails.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const emails: string[] = Array.from(
      new Set(
        inputEmails
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (
      emails.length === 0 ||
      emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return NextResponse.json({ error: "Sélection invalide" }, { status: 400 });
    }

    const result = await runWeeklySend({ recipientEmails: emails });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Envoi manuel impossible", result },
        { status: 500 }
      );
    }

    await withAdminAudit(auth.ctx, {
      action: "newsletter.manual_send",
      targetType: "newsletter_campaign",
      targetId: result.editionNo ? String(result.editionNo) : null,
      metadata: {
        requestedCount: emails.length,
        recipientCount: result.recipientCount ?? 0,
        mode: result.mode,
      },
    });

    return NextResponse.json({ result });
  }

  return NextResponse.json({ error: "type invalide" }, { status: 400 });
}
