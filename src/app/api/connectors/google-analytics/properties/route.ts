import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  ensureFreshAccessToken,
  GoogleAnalyticsConnectorError,
  listAccessibleProperties,
} from "@/lib/connectors/google-analytics/client";
import {
  loadGoogleAnalyticsCredential,
  saveGoogleAnalyticsCredentialState,
} from "@/lib/connectors/google-analytics/sync-service";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);

    const credential = await loadGoogleAnalyticsCredential(user.id, projectId);
    if (!credential?.refreshToken) {
      return NextResponse.json(
        { error: "Google Analytics non autorisé — connectez-vous via OAuth d'abord" },
        { status: 400 },
      );
    }

    const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(credential);
    if (refreshed) {
      await saveGoogleAnalyticsCredentialState(user.id, projectId, freshCredential);
    }

    const properties = await listAccessibleProperties(freshCredential);
    return NextResponse.json({ properties });
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
