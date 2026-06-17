import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const installationId = searchParams.get("installation_id");
  const stateRaw = searchParams.get("state");

  if (!installationId || !stateRaw) {
    return NextResponse.redirect(new URL("/mes-saas?github=error", request.url));
  }

  let projectId: string | null = null;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as {
      projectId?: string;
      userId?: string;
    };
    if (state.userId !== user.id) {
      return NextResponse.redirect(new URL("/mes-saas?github=unauthorized", request.url));
    }
    projectId = state.projectId ?? null;
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?github=invalid_state", request.url));
  }

  if (!projectId) {
    return NextResponse.redirect(new URL("/mes-saas?github=missing_project", request.url));
  }

  const installationIdNum = parseInt(installationId, 10);
  if (Number.isFinite(installationIdNum) && isCredentialsEncryptionConfigured()) {
    try {
      await saveConnectorCredential(user.id, projectId, "github", {
        installationId: installationIdNum,
      });
    } catch {
      // Continue même si le stockage chiffré échoue — installationId reste dans le state client
    }
  }

  const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
  cockpitUrl.searchParams.set("module", "build");
  cockpitUrl.searchParams.set("github_install", installationId);
  return NextResponse.redirect(cockpitUrl);
}
