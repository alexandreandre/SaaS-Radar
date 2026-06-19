import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { GoogleAnalyticsConnectorError } from "@/lib/connectors/google-analytics/client";
import {
  runGoogleAnalyticsSync,
  saveGoogleAnalyticsCredentialWithProperty,
} from "@/lib/connectors/google-analytics/sync-service";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const propertyId = typeof b.propertyId === "string" ? b.propertyId.trim() : "";
  const propertyDisplayName =
    typeof b.propertyDisplayName === "string" ? b.propertyDisplayName.trim() : undefined;
  const signupEvent =
    typeof b.signupEvent === "string" ? b.signupEvent.trim() : b.signupEvent === null ? null : undefined;
  const trialEvent =
    typeof b.trialEvent === "string" ? b.trialEvent.trim() : b.trialEvent === null ? null : undefined;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const { accountLabel } = await saveGoogleAnalyticsCredentialWithProperty(
      user.id,
      projectId,
      {
        propertyId,
        propertyDisplayName,
        signupEvent: signupEvent ?? "sign_up",
        trialEvent: trialEvent ?? null,
      },
    );
    const sync = await runGoogleAnalyticsSync(user.id, projectId);

    return NextResponse.json({
      accountLabel: sync.accountLabel ?? accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
      tokenExpiresAt: sync.tokenExpiresAt,
    });
  } catch (err) {
    const status =
      err instanceof GoogleAnalyticsConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur Google Analytics";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
