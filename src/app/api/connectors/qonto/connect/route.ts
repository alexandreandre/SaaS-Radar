import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { QontoConnectorError } from "@/lib/connectors/qonto/client";
import { runQontoSync } from "@/lib/connectors/qonto/sync-service";
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

  const projectId =
    typeof (body as Record<string, unknown>).projectId === "string"
      ? (body as Record<string, string>).projectId.trim()
      : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const sync = await runQontoSync(user.id, projectId);

    return NextResponse.json({
      accountLabel: sync.accountLabel,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
      tokenExpiresAt: sync.tokenExpiresAt,
    });
  } catch (err) {
    const status = err instanceof QontoConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur Qonto";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
