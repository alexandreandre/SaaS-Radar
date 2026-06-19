import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";
import { exchangeAndStoreMicrosoftAdsOAuth } from "@/lib/connectors/microsoft-ads/sync-service";
import type { MicrosoftAdsOAuthProvider } from "@/lib/connectors/microsoft-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseProvider(value: unknown): MicrosoftAdsOAuthProvider {
  return value === "google" ? "google" : "microsoft";
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL("/mes-saas?microsoft_ads=denied", request.url));
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(new URL("/mes-saas?microsoft_ads=error", request.url));
  }

  let projectId: string | null = null;
  let provider: MicrosoftAdsOAuthProvider = "microsoft";
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as {
      projectId?: string;
      userId?: string;
      provider?: string;
    };
    if (state.userId !== user.id) {
      return NextResponse.redirect(new URL("/mes-saas?microsoft_ads=unauthorized", request.url));
    }
    projectId = state.projectId ?? null;
    provider = parseProvider(state.provider);
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?microsoft_ads=invalid_state", request.url));
  }

  if (!projectId) {
    return NextResponse.redirect(new URL("/mes-saas?microsoft_ads=missing_project", request.url));
  }

  if (!isCredentialsEncryptionConfigured()) {
    const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
    cockpitUrl.searchParams.set("module", "integrations");
    cockpitUrl.searchParams.set("microsoft_ads_oauth", "encryption_error");
    return NextResponse.redirect(cockpitUrl);
  }

  try {
    await exchangeAndStoreMicrosoftAdsOAuth(user.id, projectId, code, provider);
  } catch {
    const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
    cockpitUrl.searchParams.set("module", "integrations");
    cockpitUrl.searchParams.set("microsoft_ads_oauth", "token_error");
    return NextResponse.redirect(cockpitUrl);
  }

  const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
  cockpitUrl.searchParams.set("module", "integrations");
  cockpitUrl.searchParams.set("microsoft_ads_oauth", "1");
  return NextResponse.redirect(cockpitUrl);
}
