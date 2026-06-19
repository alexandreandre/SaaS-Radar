import { NextResponse } from "next/server";
import { verifySentryWebhookSignature } from "@/lib/connectors/sentry/webhook-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("sentry-hook-signature");
  const secret =
    process.env.SENTRY_WEBHOOK_SECRET?.trim() ||
    process.env.SENTRY_CLIENT_SECRET?.trim() ||
    "";

  const verification = verifySentryWebhookSignature({
    rawBody,
    signature,
    clientSecret: secret,
  });

  if (!verification.ok) {
    const status = verification.message.includes("invalide") ? 401 : 400;
    return NextResponse.json({ error: verification.message }, { status });
  }

  return NextResponse.json({ ok: true });
}
