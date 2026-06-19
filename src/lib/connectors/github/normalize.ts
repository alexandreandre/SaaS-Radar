import type { BuildToolId } from "@/lib/build/tools";
import type { ConnectorStreamPayload, DevStream, GitHubMultiStream } from "@/lib/connectors/streams";
import { mergeGitHubMultiStream, normalizeGitHubStreamPayload } from "@/lib/connectors/streams";
import {
  GITHUB_MAX_TRACKED_REPOS,
  type GitHubCredential,
  type GitHubTrackedRepoRef,
  type LegacyGitHubCredential,
} from "@/lib/connectors/github/types";
import type { GitHubConnection, GitHubTrackedRepo, UserProject } from "@/lib/portfolio";

export function normalizeGitHubCredential(raw: LegacyGitHubCredential): GitHubCredential {
  if (raw.trackedRepos && raw.trackedRepos.length > 0) {
    return {
      installationId: raw.installationId,
      trackedRepos: raw.trackedRepos,
    };
  }
  if (raw.repoFullName?.trim()) {
    return {
      installationId: raw.installationId,
      trackedRepos: [
        {
          repoFullName: raw.repoFullName.trim(),
          isPrimary: true,
          addedAt: new Date().toISOString(),
        },
      ],
    };
  }
  return {
    installationId: raw.installationId,
    trackedRepos: [],
  };
}

export function aggregateGitHubAccountLabel(
  trackedRepos: GitHubTrackedRepoRef[] | GitHubTrackedRepo[],
): string {
  if (trackedRepos.length === 0) return "GitHub";
  const primary = trackedRepos.find((r) => r.isPrimary) ?? trackedRepos[0];
  if (trackedRepos.length === 1) return primary!.repoFullName;
  const others = trackedRepos.length - 1;
  return `${primary!.repoFullName} (+${others})`;
}

export function canAddGitHubRepo(trackedRepos: GitHubTrackedRepoRef[]): boolean {
  return trackedRepos.length < GITHUB_MAX_TRACKED_REPOS;
}

export function assertCanAddGitHubRepo(
  trackedRepos: GitHubTrackedRepoRef[],
  repoFullName: string,
): void {
  if (trackedRepos.some((r) => r.repoFullName === repoFullName)) {
    throw new Error(`Le dépôt ${repoFullName} est déjà suivi.`);
  }
  if (!canAddGitHubRepo(trackedRepos)) {
    throw new Error(`Limite de ${GITHUB_MAX_TRACKED_REPOS} dépôts GitHub atteinte.`);
  }
}

export function upsertTrackedRepoRef(
  trackedRepos: GitHubTrackedRepoRef[],
  entry: GitHubTrackedRepoRef,
  opts?: { setPrimary?: boolean },
): GitHubTrackedRepoRef[] {
  const setPrimary = opts?.setPrimary ?? entry.isPrimary ?? trackedRepos.length === 0;
  const without = trackedRepos.filter((r) => r.repoFullName !== entry.repoFullName);
  const next = [...without, { ...entry, isPrimary: setPrimary }];
  if (setPrimary) {
    return next.map((r) =>
      r.repoFullName === entry.repoFullName ? r : { ...r, isPrimary: false },
    );
  }
  if (!next.some((r) => r.isPrimary) && next.length > 0) {
    return next.map((r, i) => ({ ...r, isPrimary: i === 0 }));
  }
  return next;
}

export function removeTrackedRepoRef(
  trackedRepos: GitHubTrackedRepoRef[],
  repoFullName: string,
): GitHubTrackedRepoRef[] {
  const next = trackedRepos.filter((r) => r.repoFullName !== repoFullName);
  if (next.length > 0 && !next.some((r) => r.isPrimary)) {
    return next.map((r, i) => ({ ...r, isPrimary: i === 0 }));
  }
  return next;
}

export function setPrimaryTrackedRepoRef(
  trackedRepos: GitHubTrackedRepoRef[],
  repoFullName: string,
): GitHubTrackedRepoRef[] {
  if (!trackedRepos.some((r) => r.repoFullName === repoFullName)) {
    throw new Error(`Dépôt ${repoFullName} introuvable.`);
  }
  return trackedRepos.map((r) => ({
    ...r,
    isPrimary: r.repoFullName === repoFullName,
  }));
}

export function setLinkedToolOnRepoRef(
  trackedRepos: GitHubTrackedRepoRef[],
  repoFullName: string,
  linkedToolId: BuildToolId | undefined,
): GitHubTrackedRepoRef[] {
  return trackedRepos.map((r) =>
    r.repoFullName === repoFullName ? { ...r, linkedToolId } : r,
  );
}

export function trackedRefsToProjectRepos(
  refs: GitHubTrackedRepoRef[],
  installationId: number,
  syncedAt?: string,
): GitHubTrackedRepo[] {
  const at = syncedAt ?? new Date().toISOString();
  return refs.map((ref) => ({
    repoFullName: ref.repoFullName,
    installationId,
    connectedAt: ref.addedAt || at,
    linkedToolId: ref.linkedToolId,
    isPrimary: ref.isPrimary,
  }));
}

export function mergeProjectTrackedRepos(
  existing: GitHubTrackedRepo[] | undefined,
  incoming: GitHubTrackedRepo[],
): GitHubTrackedRepo[] {
  const map = new Map((existing ?? []).map((r) => [r.repoFullName, r]));
  for (const repo of incoming) {
    map.set(repo.repoFullName, { ...map.get(repo.repoFullName), ...repo });
  }
  return Array.from(map.values());
}

export function getPrimaryGitHubRepo(
  project: UserProject,
): GitHubTrackedRepo | undefined {
  const repos = project.githubTrackedRepos ?? [];
  return repos.find((r) => r.isPrimary) ?? repos[0];
}

export function getGitHubReposForTool(
  project: UserProject,
  toolId: BuildToolId | undefined,
): GitHubTrackedRepo[] {
  const repos = project.githubTrackedRepos ?? [];
  if (!toolId) return repos;
  return repos.filter((r) => r.linkedToolId === toolId);
}

export function getOtherGitHubRepos(
  project: UserProject,
  toolId: BuildToolId | undefined,
): GitHubTrackedRepo[] {
  const repos = project.githubTrackedRepos ?? [];
  if (!toolId) return [];
  return repos.filter((r) => r.linkedToolId !== toolId);
}

export function resolveGitHubTrackedRepos(project: UserProject): GitHubTrackedRepo[] {
  if (project.githubTrackedRepos && project.githubTrackedRepos.length > 0) {
    return project.githubTrackedRepos;
  }
  if (project.githubConnection) {
    return [legacyConnectionToTrackedRepo(project.githubConnection)];
  }
  return [];
}

export function hasGitHubTrackedRepos(project: UserProject): boolean {
  return resolveGitHubTrackedRepos(project).length > 0;
}

export function legacyConnectionToTrackedRepo(
  connection: GitHubConnection,
): GitHubTrackedRepo {
  return {
    repoFullName: connection.repoFullName,
    installationId: connection.installationId,
    connectedAt: connection.connectedAt,
    isPrimary: true,
  };
}

export function normalizeProjectGitHub(project: UserProject): UserProject {
  let next = { ...project };

  if (project.githubConnection && !project.githubTrackedRepos?.length) {
    next = {
      ...next,
      githubTrackedRepos: [legacyConnectionToTrackedRepo(project.githubConnection)],
      githubConnection: undefined,
    };
  }

  const ghStream = project.connectorStreams?.github;
  if (ghStream?.type === "dev" && ghStream.repoFullName) {
    const multi: GitHubMultiStream = {
      type: "github",
      primaryRepoFullName: ghStream.repoFullName,
      repos: { [ghStream.repoFullName]: ghStream },
    };
    next = {
      ...next,
      connectorStreams: {
        ...next.connectorStreams,
        github: multi,
      },
    };
  }

  return next;
}

export function getGitHubRepoFullNamesForMatch(project: UserProject): string[] {
  const repos = project.githubTrackedRepos ?? [];
  if (repos.length > 0) {
    const primary = getPrimaryGitHubRepo(project);
    const names = repos.map((r) => r.repoFullName);
    if (primary) {
      return [primary.repoFullName, ...names.filter((n) => n !== primary.repoFullName)];
    }
    return names;
  }
  if (project.githubConnection?.repoFullName) {
    return [project.githubConnection.repoFullName];
  }
  const stream = normalizeGitHubStreamPayload(project.connectorStreams?.github);
  if (stream) {
    const primary = stream.primaryRepoFullName;
    const names = Object.keys(stream.repos);
    if (primary) return [primary, ...names.filter((n) => n !== primary)];
    return names;
  }
  return [];
}

export function buildGitHubMultiStreamFromSync(
  existing: ConnectorStreamPayload | undefined,
  repoStreams: Array<{ repoFullName: string; stream: DevStream }>,
  primaryRepoFullName: string | undefined,
  syncedAt: string,
): GitHubMultiStream {
  let multi: GitHubMultiStream = normalizeGitHubStreamPayload(existing) ?? {
    type: "github",
    repos: {},
  };

  for (const { repoFullName, stream } of repoStreams) {
    multi = mergeGitHubMultiStream(multi, repoFullName, stream);
  }

  const primary =
    primaryRepoFullName && multi.repos[primaryRepoFullName]
      ? primaryRepoFullName
      : multi.primaryRepoFullName ?? Object.keys(multi.repos)[0];

  return {
    ...multi,
    primaryRepoFullName: primary,
    lastSyncedAt: syncedAt,
  };
}

export function removeRepoFromGitHubMultiStream(
  stream: GitHubMultiStream | undefined,
  repoFullName: string,
): GitHubMultiStream | undefined {
  if (!stream) return undefined;
  const repos = { ...stream.repos };
  delete repos[repoFullName];
  if (Object.keys(repos).length === 0) return undefined;
  let primary = stream.primaryRepoFullName;
  if (primary === repoFullName) {
    primary = Object.keys(repos)[0];
  }
  return {
    type: "github",
    repos,
    primaryRepoFullName: primary,
    lastSyncedAt: stream.lastSyncedAt,
  };
}
