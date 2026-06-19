import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { GitHubConnectorError } from "@/lib/connectors/github/client";
import { runGitHubSync } from "@/lib/connectors/github/sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const repoFullName =
    typeof b.repoFullName === "string" && b.repoFullName.trim()
      ? b.repoFullName.trim()
      : undefined;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const sync = await runGitHubSync(user.id, projectId, { repoFullName });

    return NextResponse.json({
      accountLabel: sync.accountLabel,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
      trackedRepos: sync.trackedRepos,
      productLogo: sync.productLogo,
    });
  } catch (err) {
    const status = err instanceof GitHubConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur synchronisation GitHub";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
