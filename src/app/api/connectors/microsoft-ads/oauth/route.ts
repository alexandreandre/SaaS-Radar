import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  getMicrosoftAdsAuthorizeUrl,
  isMicrosoftAdsOAuthConfigured,
  type MicrosoftAdsOAuthProvider,
} from "@/lib/connectors/microsoft-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseProvider(value: string | null): MicrosoftAdsOAuthProvider | null {
  if (value === "microsoft" || value === "google") return value;
  return null;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  const provider = parseProvider(searchParams.get("provider")?.trim() ?? null);

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!provider) {
    return NextResponse.json(
      { error: "provider requis (microsoft ou google)" },
      { status: 400 },
    );
  }

  if (!isMicrosoftAdsOAuthConfigured(provider)) {
    const envHint =
      provider === "google"
        ? "MICROSOFT_ADS_GOOGLE_CLIENT_ID, MICROSOFT_ADS_GOOGLE_CLIENT_SECRET, MICROSOFT_ADS_REDIRECT_URI"
        : "MICROSOFT_ADS_CLIENT_ID, MICROSOFT_ADS_CLIENT_SECRET, MICROSOFT_ADS_REDIRECT_URI";
    return NextResponse.json(
      { error: `Microsoft Ads OAuth non configuré (${envHint})`, configured: false },
      { status: 503 },
    );
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Accès refusé" },
      { status: 403 },
    );
  }

  const state = Buffer.from(
    JSON.stringify({ projectId, userId: user.id, provider }),
  ).toString("base64url");

  return NextResponse.redirect(getMicrosoftAdsAuthorizeUrl(state, provider));
}
