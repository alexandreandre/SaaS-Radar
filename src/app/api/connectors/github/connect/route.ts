import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { GitHubConnectorError } from "@/lib/connectors/github/client";
import { addGitHubTrackedRepo, runGitHubSync } from "@/lib/connectors/github/sync-service";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";
import type { BuildToolId } from "@/lib/build/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isCredentialsEncryptionConfigured()) {
    return NextResponse.json(
      { error: "Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY)" },
      { status: 503 },
    );
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
    typeof b.linkedToolId === "string" ? (b.linkedToolId.trim() as BuildToolId) : undefined;
  const setPrimary = b.setPrimary === true;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!repoFullName) {
    return NextResponse.json({ error: "repoFullName requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    await addGitHubTrackedRepo(user.id, projectId, repoFullName, {
      linkedToolId,
      setPrimary,
    });
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
    const message = err instanceof Error ? err.message : "Erreur connecteur GitHub";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
