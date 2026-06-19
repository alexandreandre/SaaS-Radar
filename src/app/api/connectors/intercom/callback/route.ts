import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";
import { exchangeAndStoreIntercomOAuth } from "@/lib/connectors/intercom/sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.redirect(new URL("/mes-saas?intercom=denied", request.url));
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(new URL("/mes-saas?intercom=error", request.url));
  }

  let projectId: string | null = null;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as {
      projectId?: string;
      userId?: string;
    };
    if (state.userId !== user.id) {
      return NextResponse.redirect(new URL("/mes-saas?intercom=unauthorized", request.url));
    }
    projectId = state.projectId ?? null;
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?intercom=invalid_state", request.url));
  }

  if (!projectId) {
    return NextResponse.redirect(new URL("/mes-saas?intercom=missing_project", request.url));
  }

  if (!isCredentialsEncryptionConfigured()) {
    const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
    cockpitUrl.searchParams.set("module", "integrations");
    cockpitUrl.searchParams.set("intercom_oauth", "encryption_error");
    return NextResponse.redirect(cockpitUrl);
  }

  try {
    await exchangeAndStoreIntercomOAuth(user.id, projectId, code);
  } catch {
    const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
    cockpitUrl.searchParams.set("module", "integrations");
    cockpitUrl.searchParams.set("intercom_oauth", "token_error");
    return NextResponse.redirect(cockpitUrl);
  }

  const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
  cockpitUrl.searchParams.set("module", "integrations");
  cockpitUrl.searchParams.set("intercom_oauth", "1");
  return NextResponse.redirect(cockpitUrl);
}
