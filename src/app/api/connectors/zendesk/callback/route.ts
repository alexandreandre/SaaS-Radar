import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";
import { exchangeAndStoreZendeskOAuth } from "@/lib/connectors/zendesk/sync-service";
import { normalizeSubdomain } from "@/lib/connectors/zendesk/snapshots";

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
    return NextResponse.redirect(new URL("/mes-saas?zendesk=denied", request.url));
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(new URL("/mes-saas?zendesk=error", request.url));
  }

  let projectId: string | null = null;
  let subdomain: string | null = null;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as {
      projectId?: string;
      userId?: string;
      subdomain?: string;
    };
    if (state.userId !== user.id) {
      return NextResponse.redirect(new URL("/mes-saas?zendesk=unauthorized", request.url));
    }
    projectId = state.projectId ?? null;
    subdomain = normalizeSubdomain(state.subdomain ?? "");
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?zendesk=invalid_state", request.url));
  }

  if (!projectId || !subdomain) {
    return NextResponse.redirect(new URL("/mes-saas?zendesk=missing_project", request.url));
  }

  if (!isCredentialsEncryptionConfigured()) {
    const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
    cockpitUrl.searchParams.set("module", "integrations");
    cockpitUrl.searchParams.set("zendesk_oauth", "encryption_error");
    return NextResponse.redirect(cockpitUrl);
  }

  try {
    await exchangeAndStoreZendeskOAuth(user.id, projectId, subdomain, code);
  } catch {
    const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
    cockpitUrl.searchParams.set("module", "integrations");
    cockpitUrl.searchParams.set("zendesk_oauth", "token_error");
    return NextResponse.redirect(cockpitUrl);
  }

  const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
  cockpitUrl.searchParams.set("module", "integrations");
  cockpitUrl.searchParams.set("zendesk_oauth", "1");
  return NextResponse.redirect(cockpitUrl);
}
