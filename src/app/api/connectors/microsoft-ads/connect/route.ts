import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { MicrosoftAdsConnectorError } from "@/lib/connectors/microsoft-ads/client";
import {
  runMicrosoftAdsSync,
  saveMicrosoftAdsCredentialWithAccount,
} from "@/lib/connectors/microsoft-ads/sync-service";
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
  const accountId = typeof b.accountId === "string" ? b.accountId.trim() : "";
  const customerId = typeof b.customerId === "string" ? b.customerId.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!accountId) {
    return NextResponse.json({ error: "accountId requis" }, { status: 400 });
  }
  if (!customerId) {
    return NextResponse.json({ error: "customerId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    await saveMicrosoftAdsCredentialWithAccount(user.id, projectId, accountId, customerId);
    const sync = await runMicrosoftAdsSync(user.id, projectId);
    return NextResponse.json({
      accountLabel: sync.accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
      tokenExpiresAt: sync.tokenExpiresAt,
    });
  } catch (err) {
    const status = err instanceof MicrosoftAdsConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Microsoft Ads";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
