import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  parsePostHogCredential,
  PostHogConnectorError,
} from "@/lib/connectors/posthog/client";
import { runPostHogSync, savePostHogCredential } from "@/lib/connectors/posthog/sync-service";
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
  const personalApiKey = typeof b.personalApiKey === "string" ? b.personalApiKey.trim() : "";
  const posthogProjectId =
    typeof b.posthogProjectId === "string" ? b.posthogProjectId.trim() : "";
  const appHost = typeof b.appHost === "string" ? b.appHost.trim() : undefined;
  const signupEvent = typeof b.signupEvent === "string" ? b.signupEvent.trim() : null;
  const activationEvent =
    typeof b.activationEvent === "string" ? b.activationEvent.trim() : null;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!personalApiKey || !posthogProjectId) {
    return NextResponse.json({ error: "personalApiKey et posthogProjectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parsePostHogCredential({
      personalApiKey,
      projectId: posthogProjectId,
      appHost,
      signupEvent: signupEvent || null,
      activationEvent: activationEvent || null,
    });
    const { accountLabel } = await savePostHogCredential(user.id, projectId, credential);
    const sync = await runPostHogSync(user.id, projectId);

    return NextResponse.json({
      accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof PostHogConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur PostHog";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
