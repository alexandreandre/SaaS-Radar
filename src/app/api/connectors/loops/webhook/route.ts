import { NextResponse } from "next/server";
import { loadConnectorCredentialByProject } from "@/lib/connectors/credentials-store";
import type { LoopsCredential } from "@/lib/connectors/loops/types";
import {
  extractLoopsWebhookHeaders,
  verifyLoopsWebhookSignature,
} from "@/lib/connectors/loops/webhook-verify";
import {
  insertLoopsWebhookEvent,
} from "@/lib/connectors/loops/webhook-store";
import { parseLoopsWebhookPayload } from "@/lib/connectors/loops/webhook-parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId")?.trim() ?? "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
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

  const credential = await loadConnectorCredentialByProject<LoopsCredential>(projectId, "loops");
  if (!credential?.webhookSigningSecret) {
    return NextResponse.json({ error: "Loops non connecté pour ce projet" }, { status: 404 });
  }

  const headers = extractLoopsWebhookHeaders(request.headers);
  if (!headers.eventId || !headers.timestamp || !headers.signature) {
    return NextResponse.json({ error: "En-têtes webhook manquants" }, { status: 400 });
  }

  const verification = verifyLoopsWebhookSignature({
    eventId: headers.eventId,
    timestamp: headers.timestamp,
    signatureHeader: headers.signature,
    rawBody,
    signingSecret: credential.webhookSigningSecret,
  });

  if (!verification.ok) {
    const status = verification.code === "INVALID_SIGNATURE" ? 401 : 400;
    return NextResponse.json({ error: verification.message }, { status });
  }

  const parsed = parseLoopsWebhookPayload(headers.eventId, payload);
  if (!parsed) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await insertLoopsWebhookEvent(projectId, parsed);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur traitement webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
