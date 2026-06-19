import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { saveGitHubInstallation } from "@/lib/connectors/github/sync-service";
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
  let redirectModule: string | undefined;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as {
      projectId?: string;
      userId?: string;
      module?: string;
    };
    if (state.userId !== user.id) {
      return NextResponse.redirect(new URL("/mes-saas?github=unauthorized", request.url));
    }
    projectId = state.projectId ?? null;
    redirectModule = state.module;
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?github=invalid_state", request.url));
  }

  if (!projectId) {
    return NextResponse.redirect(new URL("/mes-saas?github=missing_project", request.url));
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
  } catch {
    return NextResponse.redirect(new URL("/mes-saas?github=unauthorized", request.url));
  }

  const installationIdNum = parseInt(installationId, 10);
  if (Number.isFinite(installationIdNum) && isCredentialsEncryptionConfigured()) {
    try {
      await saveGitHubInstallation(user.id, projectId, installationIdNum);
    } catch {
      return NextResponse.redirect(
        new URL(`/cockpit/${projectId}?github_oauth=encryption_error`, request.url),
      );
    }
  }

  const cockpitUrl = new URL(`/cockpit/${projectId}`, request.url);
  cockpitUrl.searchParams.set("github_oauth", "1");
  if (redirectModule === "build") {
    cockpitUrl.searchParams.set("module", "build");
  }
  return NextResponse.redirect(cockpitUrl);
}
