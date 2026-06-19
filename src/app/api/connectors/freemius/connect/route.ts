import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  FreemiusConnectorError,
  parseFreemiusCredential,
} from "@/lib/connectors/freemius/client";
import {
  runFreemiusSync,
  saveFreemiusCredential,
} from "@/lib/connectors/freemius/sync-service";
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
  const productId = typeof b.productId === "string" ? b.productId.trim() : "";
  const apiToken = typeof b.apiToken === "string" ? b.apiToken.trim() : "";
  const productTitle = typeof b.productTitle === "string" ? b.productTitle.trim() : undefined;
  const currency = typeof b.currency === "string" ? b.currency.trim() : undefined;
  const sandbox = typeof b.sandbox === "boolean" ? b.sandbox : undefined;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!productId || !apiToken) {
    return NextResponse.json({ error: "productId et apiToken requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parseFreemiusCredential({
      productId,
      apiToken,
      productTitle,
      currency,
      sandbox,
    });
    const { accountLabel } = await saveFreemiusCredential(user.id, projectId, credential);
    const sync = await runFreemiusSync(user.id, projectId);

    return NextResponse.json({
      accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof FreemiusConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Freemius";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
