import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exchangeVercelCode } from "@/lib/vercel/client";
import { saveConnectorCredential } from "@/lib/connectors/credentials-store";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

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

  if (!code || !stateRaw) {
    return NextResponse.redirect(new URL("/mes-saas?vercel=error", request.url));
  }

  let projectId: string | null = null;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as {
      projectId?: string;
      userId?: string;
    };
    if (state.userId !== user.id) {
      return NextResponse.redirect(new URL("/mes-saas?vercel=unauthorized", request.url));
    }
    projectId = state.projectId ?? null;
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?vercel=invalid_state", request.url));
  }

  if (!projectId) {
    return NextResponse.redirect(new URL("/mes-saas?vercel=missing_project", request.url));
  }

  try {
    const tokens = await exchangeVercelCode(code);
    if (isCredentialsEncryptionConfigured()) {
      await saveConnectorCredential(user.id, projectId, "vercel", {
        accessToken: tokens.accessToken,
        teamId: tokens.teamId ?? null,
        userId: tokens.userId ?? null,
      });
    }
  } catch {
    return NextResponse.redirect(
      new URL(`/cockpit/${projectId}?module=build&vercel=token_error`, request.url),
    );
  }

  const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
  cockpitUrl.searchParams.set("module", "build");
  cockpitUrl.searchParams.set("vercel_connected", "1");
  return NextResponse.redirect(cockpitUrl);
}
