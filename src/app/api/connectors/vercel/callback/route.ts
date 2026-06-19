import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";
import {
  exchangeAndStoreVercelOAuth,
  tryAutoConnectVercelAfterOAuth,
} from "@/lib/connectors/vercel/sync-service";
import type { VercelOAuthState } from "@/lib/connectors/vercel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildRedirectUrl(
  request: Request,
  projectId: string,
  state: VercelOAuthState,
  param: string,
): URL {
  const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
  if (state.returnTo === "integrations") {
    cockpitUrl.searchParams.set("module", "integrations");
    cockpitUrl.searchParams.set("vercel_oauth", param);
  } else {
    cockpitUrl.searchParams.set("module", "build");
    cockpitUrl.searchParams.set("vercel_oauth", param);
  }
  return cockpitUrl;
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
    return NextResponse.redirect(new URL("/mes-saas?vercel=denied", request.url));
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(new URL("/mes-saas?vercel=error", request.url));
  }

  let state: VercelOAuthState | null = null;
  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as VercelOAuthState;
    if (parsed.userId !== user.id) {
      return NextResponse.redirect(new URL("/mes-saas?vercel=unauthorized", request.url));
    }
    state = parsed;
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?vercel=invalid_state", request.url));
  }

  if (!state?.projectId) {
    return NextResponse.redirect(new URL("/mes-saas?vercel=missing_project", request.url));
  }

  if (!isCredentialsEncryptionConfigured()) {
    return NextResponse.redirect(
      buildRedirectUrl(request, state.projectId, state, "unavailable"),
    );
  }

  try {
    await exchangeAndStoreVercelOAuth(user.id, state.projectId, code);
  } catch {
    return NextResponse.redirect(
      buildRedirectUrl(request, state.projectId, state, "token_error"),
    );
  }

  try {
    const auto = await tryAutoConnectVercelAfterOAuth(user.id, state.projectId);
    if (auto.kind === "connected") {
      return NextResponse.redirect(
        buildRedirectUrl(request, state.projectId, state, "connected"),
      );
    }
    if (auto.kind === "none") {
      return NextResponse.redirect(
        buildRedirectUrl(request, state.projectId, state, "no_projects"),
      );
    }
  } catch {
    return NextResponse.redirect(
      buildRedirectUrl(request, state.projectId, state, "1"),
    );
  }

  return NextResponse.redirect(buildRedirectUrl(request, state.projectId, state, "1"));
}
