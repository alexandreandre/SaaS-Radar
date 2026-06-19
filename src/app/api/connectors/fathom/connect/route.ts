import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  FathomConnectorError,
  parseFathomCredential,
} from "@/lib/connectors/fathom/client";
import { runFathomSync, saveFathomCredential } from "@/lib/connectors/fathom/sync-service";
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
  const apiKey = typeof b.apiKey === "string" ? b.apiKey.trim() : "";
  const siteId = typeof b.siteId === "string" ? b.siteId.trim() : "";
  const signupEventId =
    typeof b.signupEventId === "string" ? b.signupEventId.trim() : null;
  const signupEventName =
    typeof b.signupEventName === "string" ? b.signupEventName.trim() : null;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiKey || !siteId) {
    return NextResponse.json({ error: "apiKey et siteId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parseFathomCredential({
      apiKey,
      siteId,
      signupEventId: signupEventId || null,
      signupEventName: signupEventName || null,
    });
    const { accountLabel } = await saveFathomCredential(user.id, projectId, credential);
    const sync = await runFathomSync(user.id, projectId);

    return NextResponse.json({
      accountLabel,
      snapshots: sync.snapshots,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof FathomConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Fathom";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
