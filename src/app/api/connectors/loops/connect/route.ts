import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  LoopsConnectorError,
  parseLoopsCredential,
} from "@/lib/connectors/loops/client";
import { runLoopsSync, saveLoopsCredential } from "@/lib/connectors/loops/sync-service";
import type { LoopsConversionMode } from "@/lib/connectors/loops/types";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseConversionMode(value: unknown): LoopsConversionMode {
  return value === "email_clicked" ? "email_clicked" : "mailing_list";
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
  const webhookSigningSecret =
    typeof b.webhookSigningSecret === "string" ? b.webhookSigningSecret.trim() : "";
  const conversionListId =
    typeof b.conversionListId === "string" ? b.conversionListId.trim() : null;
  const conversionListName =
    typeof b.conversionListName === "string" ? b.conversionListName.trim() : null;
  const conversionMode = parseConversionMode(b.conversionMode);

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiKey || !webhookSigningSecret) {
    return NextResponse.json({ error: "apiKey et webhookSigningSecret requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parseLoopsCredential({
      apiKey,
      webhookSigningSecret,
      conversionListId,
      conversionMode,
    });
    const { accountLabel } = await saveLoopsCredential(
      user.id,
      projectId,
      credential,
      conversionListName,
    );
    const sync = await runLoopsSync(user.id, projectId);

    return NextResponse.json({
      accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof LoopsConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Loops";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
