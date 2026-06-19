import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  parseResendCredential,
  ResendConnectorError,
} from "@/lib/connectors/resend/client";
import { runResendSync, saveResendCredential } from "@/lib/connectors/resend/sync-service";
import type { ResendConversionMode } from "@/lib/connectors/resend/types";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseConversionMode(value: unknown): ResendConversionMode {
  return value === "segment" ? "segment" : "email_clicked";
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
  const conversionSegmentId =
    typeof b.conversionSegmentId === "string" ? b.conversionSegmentId.trim() : null;
  const conversionSegmentName =
    typeof b.conversionSegmentName === "string" ? b.conversionSegmentName.trim() : null;
  const conversionMode = parseConversionMode(b.conversionMode);

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiKey || !webhookSigningSecret) {
    return NextResponse.json({ error: "apiKey et webhookSigningSecret requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parseResendCredential({
      apiKey,
      webhookSigningSecret,
      conversionSegmentId,
      conversionSegmentName,
      conversionMode,
    });
    const { accountLabel } = await saveResendCredential(
      user.id,
      projectId,
      credential,
      conversionSegmentName,
    );
    const sync = await runResendSync(user.id, projectId);

    return NextResponse.json({
      accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof ResendConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Resend";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
