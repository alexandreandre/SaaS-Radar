import { NextResponse } from "next/server";
import { loadConnectorCredentialByProject } from "@/lib/connectors/credentials-store";
import type { BrevoCredential } from "@/lib/connectors/brevo/types";
import { parseBrevoWebhookPayload } from "@/lib/connectors/brevo/webhook-parse";
import { verifyBrevoWebhookToken } from "@/lib/connectors/brevo/webhook-verify";
import { insertBrevoWebhookEvent } from "@/lib/connectors/brevo/webhook-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  const credential = await loadConnectorCredentialByProject<BrevoCredential>(projectId, "brevo");
  if (!credential?.webhookToken) {
    return NextResponse.json({ error: "Brevo non connecté pour ce projet" }, { status: 404 });
  }

  const verification = verifyBrevoWebhookToken(token, credential.webhookToken);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.message }, { status: 401 });
  }

  const rawBody = await request.text();
  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
    }
  }

  const parsed = parseBrevoWebhookPayload(payload);
  if (!parsed) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await insertBrevoWebhookEvent(projectId, parsed);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur traitement webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
