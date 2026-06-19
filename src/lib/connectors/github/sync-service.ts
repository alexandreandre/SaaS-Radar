import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { buildProductLogo } from "@/lib/build/product-logo";
import type { ProductLogo } from "@/lib/portfolio";
import type { GitHubTrackedRepo } from "@/lib/portfolio";
import { getInstallationAccessToken, GitHubConnectorError } from "@/lib/connectors/github/client";
import {
  assertRepoInInstallation,
  detectRepoLogo,
  fetchRepoMetrics,
  listInstallationRepos,
} from "@/lib/connectors/github/metrics";
import {
  aggregateGitHubAccountLabel,
  assertCanAddGitHubRepo,
  buildGitHubMultiStreamFromSync,
  normalizeGitHubCredential,
  removeTrackedRepoRef,
  setLinkedToolOnRepoRef,
  setPrimaryTrackedRepoRef,
  trackedRefsToProjectRepos,
  upsertTrackedRepoRef,
} from "@/lib/connectors/github/normalize";
import { metricsToDevStream, parseRepoFullName } from "@/lib/connectors/github/streams";
import type {
  AddGitHubRepoOptions,
  GitHubCredential,
  GitHubRepoSummary,
  LegacyGitHubCredential,
} from "@/lib/connectors/github/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";
import type { DevStream, GitHubMultiStream } from "@/lib/connectors/streams";
import { normalizeGitHubStreamPayload } from "@/lib/connectors/streams";

export type GitHubSyncPayload = ConnectorSyncResult & {
  accountLabel: string;
  trackedRepos: GitHubTrackedRepo[];
  stream: GitHubMultiStream;
  productLogo?: ProductLogo;
};

async function loadNormalizedCredential(
  userId: string,
  projectId: string,
): Promise<GitHubCredential | null> {
  const stored = await loadConnectorCredential<LegacyGitHubCredential>(
    userId,
    projectId,
    "github",
  );
  if (!stored?.data?.installationId) return null;
  return normalizeGitHubCredential(stored.data);
}

async function persistGitHubCredential(
  userId: string,
  projectId: string,
  credential: GitHubCredential,
): Promise<void> {
  const primary = credential.trackedRepos.find((r) => r.isPrimary);
  await saveConnectorCredential(userId, projectId, "github", credential, {
    installationConnected: true,
    accountLabel: aggregateGitHubAccountLabel(credential.trackedRepos),
    primaryRepoFullName: primary?.repoFullName,
    trackedCount: credential.trackedRepos.length,
  });
}

export async function loadGitHubCredential(
  userId: string,
  projectId: string,
): Promise<GitHubCredential | null> {
  return loadNormalizedCredential(userId, projectId);
}

export async function saveGitHubInstallation(
  userId: string,
  projectId: string,
  installationId: number,
): Promise<void> {
  const existing = await loadNormalizedCredential(userId, projectId);
  await persistGitHubCredential(userId, projectId, {
    installationId,
    trackedRepos: existing?.trackedRepos ?? [],
  });
}

export async function addGitHubTrackedRepo(
  userId: string,
  projectId: string,
  repoFullName: string,
  opts?: AddGitHubRepoOptions,
): Promise<GitHubCredential> {
  const existing = await loadNormalizedCredential(userId, projectId);
  if (!existing?.installationId) {
    throw new GitHubConnectorError(
      "Installation GitHub manquante — installez d'abord l'app GitHub.",
      400,
    );
  }

  const trimmed = repoFullName.trim();
  const parsed = parseRepoFullName(trimmed);
  if (!parsed) {
    throw new GitHubConnectorError("Format repo invalide — attendu owner/repo.", 400);
  }

  assertCanAddGitHubRepo(existing.trackedRepos, trimmed);

  const token = await getInstallationAccessToken(existing.installationId);
  await assertRepoInInstallation(token, trimmed);

  const entry = {
    repoFullName: trimmed,
    linkedToolId: opts?.linkedToolId,
    isPrimary: opts?.setPrimary ?? existing.trackedRepos.length === 0,
    addedAt: new Date().toISOString(),
  };

  const credential: GitHubCredential = {
    installationId: existing.installationId,
    trackedRepos: upsertTrackedRepoRef(existing.trackedRepos, entry, {
      setPrimary: opts?.setPrimary,
    }),
  };

  await persistGitHubCredential(userId, projectId, credential);
  return credential;
}

/** @deprecated use addGitHubTrackedRepo */
export async function saveGitHubCredentialWithRepo(
  userId: string,
  projectId: string,
  repoFullName: string,
  opts?: AddGitHubRepoOptions,
): Promise<GitHubCredential> {
  return addGitHubTrackedRepo(userId, projectId, repoFullName, opts);
}

export async function removeGitHubTrackedRepo(
  userId: string,
  projectId: string,
  repoFullName: string,
): Promise<{ disconnected: boolean; credential: GitHubCredential | null }> {
  const existing = await loadNormalizedCredential(userId, projectId);
  if (!existing) {
    throw new GitHubConnectorError("GitHub non connecté pour ce projet", 404);
  }

  const nextRefs = removeTrackedRepoRef(existing.trackedRepos, repoFullName.trim());
  if (nextRefs.length === 0) {
    await deleteConnectorCredential(userId, projectId, "github");
    return { disconnected: true, credential: null };
  }

  const credential: GitHubCredential = {
    installationId: existing.installationId,
    trackedRepos: nextRefs,
  };
  await persistGitHubCredential(userId, projectId, credential);
  return { disconnected: false, credential };
}

export async function setPrimaryGitHubRepo(
  userId: string,
  projectId: string,
  repoFullName: string,
): Promise<GitHubCredential> {
  const existing = await loadNormalizedCredential(userId, projectId);
  if (!existing) {
    throw new GitHubConnectorError("GitHub non connecté pour ce projet", 404);
  }

  const credential: GitHubCredential = {
    installationId: existing.installationId,
    trackedRepos: setPrimaryTrackedRepoRef(existing.trackedRepos, repoFullName.trim()),
  };
  await persistGitHubCredential(userId, projectId, credential);
  return credential;
}

export async function unlinkGitHubRepoTool(
  userId: string,
  projectId: string,
  repoFullName: string,
): Promise<GitHubCredential> {
  const existing = await loadNormalizedCredential(userId, projectId);
  if (!existing) {
    throw new GitHubConnectorError("GitHub non connecté pour ce projet", 404);
  }

  const credential: GitHubCredential = {
    installationId: existing.installationId,
    trackedRepos: setLinkedToolOnRepoRef(existing.trackedRepos, repoFullName.trim(), undefined),
  };
  await persistGitHubCredential(userId, projectId, credential);
  return credential;
}

export async function setGitHubRepoToolLink(
  userId: string,
  projectId: string,
  repoFullName: string,
  linkedToolId: string | null,
): Promise<GitHubCredential> {
  const existing = await loadNormalizedCredential(userId, projectId);
  if (!existing) {
    throw new GitHubConnectorError("GitHub non connecté pour ce projet", 404);
  }

  const credential: GitHubCredential = {
    installationId: existing.installationId,
    trackedRepos: setLinkedToolOnRepoRef(
      existing.trackedRepos,
      repoFullName.trim(),
      linkedToolId ? (linkedToolId as AddGitHubRepoOptions["linkedToolId"]) : undefined,
    ),
  };
  await persistGitHubCredential(userId, projectId, credential);
  return credential;
}

export async function listGitHubReposForProject(
  userId: string,
  projectId: string,
): Promise<{ repos: GitHubRepoSummary[]; tracked: string[] }> {
  const credential = await loadNormalizedCredential(userId, projectId);
  if (!credential?.installationId) {
    throw new GitHubConnectorError("GitHub non installé pour ce projet", 404);
  }

  const token = await getInstallationAccessToken(credential.installationId);
  const repos = await listInstallationRepos(token);
  return {
    repos,
    tracked: credential.trackedRepos.map((r) => r.repoFullName),
  };
}

async function syncSingleRepo(
  token: string,
  repoFullName: string,
): Promise<{ repoFullName: string; stream: DevStream }> {
  const parsed = parseRepoFullName(repoFullName);
  if (!parsed) {
    throw new GitHubConnectorError(`Dépôt GitHub invalide : ${repoFullName}`, 400);
  }
  const metrics = await fetchRepoMetrics(token, parsed.owner, parsed.repo);
  return { repoFullName, stream: metricsToDevStream(metrics) };
}

export async function runGitHubSync(
  userId: string,
  projectId: string,
  options?: {
    repoFullName?: string;
    existingStream?: ReturnType<typeof normalizeGitHubStreamPayload>;
  },
): Promise<GitHubSyncPayload> {
  const credential = await loadNormalizedCredential(userId, projectId);
  if (!credential?.installationId) {
    throw new GitHubConnectorError("GitHub non connecté pour ce projet", 404);
  }

  const targets = options?.repoFullName
    ? credential.trackedRepos.filter((r) => r.repoFullName === options.repoFullName)
    : credential.trackedRepos;

  if (targets.length === 0) {
    throw new GitHubConnectorError(
      options?.repoFullName
        ? `Dépôt ${options.repoFullName} non suivi.`
        : "Aucun dépôt suivi — ajoutez un repo GitHub.",
      400,
    );
  }

  const token = await getInstallationAccessToken(credential.installationId);
  const repoStreams: Array<{ repoFullName: string; stream: DevStream }> = [];

  for (const ref of targets) {
    repoStreams.push(await syncSingleRepo(token, ref.repoFullName));
  }

  const syncedAt = new Date().toISOString();
  const primary = credential.trackedRepos.find((r) => r.isPrimary);

  const stream = buildGitHubMultiStreamFromSync(
    options?.existingStream ?? undefined,
    repoStreams,
    primary?.repoFullName,
    syncedAt,
  );

  const trackedRepos = trackedRefsToProjectRepos(
    credential.trackedRepos,
    credential.installationId,
    syncedAt,
  );

  let productLogo: ProductLogo | undefined;
  const primaryName = stream.primaryRepoFullName;
  if (primaryName) {
    const parsed = parseRepoFullName(primaryName);
    const primaryStream = stream.repos[primaryName];
    if (parsed && primaryStream?.defaultBranch) {
      const logoUrl = await detectRepoLogo(
        token,
        parsed.owner,
        parsed.repo,
        primaryStream.defaultBranch,
      );
      if (logoUrl) productLogo = buildProductLogo(logoUrl, "github");
    }
  }

  return {
    stream,
    accountLabel: aggregateGitHubAccountLabel(credential.trackedRepos),
    syncedAt,
    trackedRepos,
    productLogo,
  };
}

export async function disconnectGitHub(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "github");
}
