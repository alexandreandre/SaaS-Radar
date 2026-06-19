import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { SentryConnectorError } from "@/lib/connectors/sentry/client";
import { connectSentryWithProject } from "@/lib/connectors/sentry/sync-service";
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
  const sentryProjectId =
    typeof b.sentryProjectId === "string" ? b.sentryProjectId.trim() : "";
  const sentryProjectSlug =
    typeof b.sentryProjectSlug === "string" ? b.sentryProjectSlug.trim() : undefined;
  const projectName = typeof b.projectName === "string" ? b.projectName.trim() : undefined;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!sentryProjectId) {
    return NextResponse.json({ error: "sentryProjectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const sync = await connectSentryWithProject(user.id, projectId, {
      sentryProjectId,
      sentryProjectSlug,
      projectName,
    });

    return NextResponse.json({
      accountLabel: sync.accountLabel,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
      tokenExpiresAt: sync.tokenExpiresAt,
    });
  } catch (err) {
    const status = err instanceof SentryConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Sentry";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
