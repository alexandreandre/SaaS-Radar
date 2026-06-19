import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  BrevoConnectorError,
  parseBrevoCredential,
} from "@/lib/connectors/brevo/client";
import { runBrevoSync, saveBrevoCredential } from "@/lib/connectors/brevo/sync-service";
import type { BrevoConversionMode } from "@/lib/connectors/brevo/types";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseConversionMode(value: unknown): BrevoConversionMode {
  return value === "list_addition" ? "list_addition" : "campaign_clicks";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isCredentialsEncryptionConfigured()) {
    return NextResponse.json(
      { error: "Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY)" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const apiKey = typeof b.apiKey === "string" ? b.apiKey.trim() : "";
  const conversionListId =
    typeof b.conversionListId === "string" ? b.conversionListId.trim() : null;
  const conversionListName =
    typeof b.conversionListName === "string" ? b.conversionListName.trim() : null;
  const conversionMode = parseConversionMode(b.conversionMode);
  const webhookToken = typeof b.webhookToken === "string" ? b.webhookToken.trim() : null;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "apiKey requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parseBrevoCredential({
      apiKey,
      conversionMode,
      conversionListId,
      conversionListName,
      webhookToken,
    });
    const { accountLabel } = await saveBrevoCredential(
      user.id,
      projectId,
      credential,
      conversionListName,
    );
    const sync = await runBrevoSync(user.id, projectId);

    return NextResponse.json({
      accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof BrevoConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Brevo";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
