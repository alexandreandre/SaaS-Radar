import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { getGitHubInstallUrl, isGitHubAppConfigured } from "@/lib/connectors/github/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim() ?? "";
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Accès refusé" },
      { status: 403 },
    );
  }

  if (!isGitHubAppConfigured()) {
    return NextResponse.json(
      {
        error: "GitHub App non configurée",
        configured: false,
      },
      { status: 503 },
    );
  }

  const state = Buffer.from(
    JSON.stringify({
      projectId,
      userId: user.id,
      module: searchParams.get("module") === "build" ? "build" : undefined,
    }),
  ).toString("base64url");
  const url = getGitHubInstallUrl(state);
  if (!url) {
    return NextResponse.json({ error: "GITHUB_APP_SLUG manquant" }, { status: 503 });
  }

  return NextResponse.redirect(url);
}
