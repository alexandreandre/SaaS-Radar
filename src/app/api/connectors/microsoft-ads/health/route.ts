import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { loadMicrosoftAdsCredential } from "@/lib/connectors/microsoft-ads/sync-service";
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
    const credential = await loadMicrosoftAdsCredential(user.id, projectId);

    return NextResponse.json({
      hasCredential: Boolean(credential?.refreshToken),
      tokenExpiresAt: credential?.accessTokenExpiresAt,
      accountId: credential?.accountId,
      customerId: credential?.customerId,
      identityProvider: credential?.identityProvider,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Microsoft Ads" },
      { status: 500 },
    );
  }
}
