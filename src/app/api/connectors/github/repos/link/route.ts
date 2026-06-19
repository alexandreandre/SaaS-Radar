import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { GitHubConnectorError } from "@/lib/connectors/github/client";
import { setGitHubRepoToolLink } from "@/lib/connectors/github/sync-service";
import type { BuildToolId } from "@/lib/build/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
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
  const repoFullName = typeof b.repoFullName === "string" ? b.repoFullName.trim() : "";
  const linkedToolId =
    b.linkedToolId === null
      ? null
      : typeof b.linkedToolId === "string"
        ? (b.linkedToolId.trim() as BuildToolId)
        : undefined;

  if (!projectId || !repoFullName) {
    return NextResponse.json({ error: "projectId et repoFullName requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = await setGitHubRepoToolLink(
      user.id,
      projectId,
      repoFullName,
      linkedToolId ?? null,
    );
    return NextResponse.json({
      ok: true,
      trackedRepos: credential.trackedRepos,
    });
  } catch (err) {
    const status = err instanceof GitHubConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur liaison outil";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
