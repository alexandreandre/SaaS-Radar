import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";
import { exchangeAndStoreSentryOAuth } from "@/lib/connectors/sentry/sync-service";
import { SENTRY_OAUTH_STATE_COOKIE } from "@/lib/connectors/sentry/oauth-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToCockpit(request: Request, projectId: string, status: string) {
  const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
  cockpitUrl.searchParams.set("module", "integrations");
  cockpitUrl.searchParams.set("sentry_oauth", status);
  return NextResponse.redirect(cockpitUrl);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const installationId = searchParams.get("installationId")?.trim();
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const stateRaw = cookieStore.get(SENTRY_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(SENTRY_OAUTH_STATE_COOKIE);

  if (oauthError) {
    return NextResponse.redirect(new URL("/mes-saas?sentry_oauth=denied", request.url));
  }

  if (!code || !installationId || !stateRaw) {
    return NextResponse.redirect(new URL("/mes-saas?sentry_oauth=error", request.url));
  }

  let projectId: string | null = null;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as {
      projectId?: string;
      userId?: string;
    };
    if (state.userId !== user.id) {
      return NextResponse.redirect(new URL("/mes-saas?sentry_oauth=unauthorized", request.url));
    }
    projectId = state.projectId ?? null;
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?sentry_oauth=invalid_state", request.url));
  }

  if (!projectId) {
    return NextResponse.redirect(new URL("/mes-saas?sentry_oauth=missing_project", request.url));
  }

  if (!isCredentialsEncryptionConfigured()) {
    return redirectToCockpit(request, projectId, "encryption_error");
  }

  try {
    await exchangeAndStoreSentryOAuth(user.id, projectId, installationId, code);
  } catch {
    return redirectToCockpit(request, projectId, "token_error");
  }

  return redirectToCockpit(request, projectId, "1");
}
