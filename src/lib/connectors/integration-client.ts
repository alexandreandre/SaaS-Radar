import {
  mergeSnapshots,
  mergeProjectStreams,
} from "@/lib/connectors";
import type { ConnectorId, Integration, MetricsSnapshot } from "@/lib/connectors/types";
import type { ConnectorStreamPayload } from "@/lib/connectors/streams";
import { removeConnectorStream } from "@/lib/connectors/streams";
import { PAYMENT_CONNECTOR_IDS } from "@/lib/revenue-helpers";
import type { UserProject } from "@/lib/portfolio";
import type { GitHubConnection, GitHubTrackedRepo, ProductLogo } from "@/lib/portfolio";
import { mergeDetectedProductLogo } from "@/lib/build/product-logo-client";
import { mergeProjectTrackedRepos } from "@/lib/connectors/github/normalize";
import { getPrimaryGitHubRepo } from "@/lib/connectors/github/normalize";

export type ConnectorSyncApiResponse = {
  accountLabel?: string;
  snapshots?: MetricsSnapshot[];
  stream?: ConnectorStreamPayload | null;
  syncedAt?: string;
  tokenExpiresAt?: string;
  /** @deprecated */
  connection?: GitHubConnection;
  trackedRepos?: GitHubTrackedRepo[];
  productLogo?: ProductLogo;
};

export function demoteOtherPaymentIntegrations(
  integrations: Integration[],
  activeId: ConnectorId,
): Integration[] {
  if (!PAYMENT_CONNECTOR_IDS.includes(activeId)) return integrations;

  return integrations.map((i) => {
    if (
      i.connectorId !== activeId &&
      PAYMENT_CONNECTOR_IDS.includes(i.connectorId) &&
      (i.status === "demo" || i.status === "connected")
    ) {
      return { ...i, status: "disconnected" as const };
    }
    return i;
  });
}

export function applyConnectorSyncToProject(
  project: UserProject,
  connectorId: ConnectorId,
  result: ConnectorSyncApiResponse,
  status: "demo" | "connected",
  accountLabel: string,
): UserProject {
  const now = result.syncedAt ?? new Date().toISOString();
  const snapshots = result.snapshots ?? [];
  const integrations = [...(project.integrations ?? [])];
  const idx = integrations.findIndex((i) => i.connectorId === connectorId);

  const previous = idx >= 0 ? integrations[idx] : undefined;

  const entry: Integration = {
    connectorId,
    status,
    connectedAt: previous?.connectedAt ?? now,
    lastSyncAt: now,
    accountLabel,
    syncSchedule: previous?.syncSchedule ?? "manual",
    lastError: undefined,
    tokenExpiresAt: result.tokenExpiresAt ?? previous?.tokenExpiresAt,
  };

  if (idx >= 0) integrations[idx] = entry;
  else integrations.push(entry);

  const normalizedIntegrations = demoteOtherPaymentIntegrations(integrations, connectorId);

  let connectorStreams = project.connectorStreams ?? {};
  if (result.stream) {
    connectorStreams = mergeProjectStreams(connectorStreams, connectorId, result.stream);
  }

  const latestMrr = snapshots.at(-1)?.mrr ?? project.currentMrr;

  return {
    ...project,
    integrations: normalizedIntegrations,
    connectorStreams,
    metricsHistory: mergeSnapshots(project.metricsHistory ?? [], snapshots),
    currentMrr: latestMrr > 0 ? latestMrr : project.currentMrr,
  };
}

export function applyGitHubSyncToProject(
  project: UserProject,
  result: ConnectorSyncApiResponse,
  status: "demo" | "connected",
): UserProject {
  const primary = result.trackedRepos?.find((r) => r.isPrimary) ?? result.trackedRepos?.[0];
  const label =
    result.accountLabel ??
    primary?.repoFullName ??
    getPrimaryGitHubRepo(project)?.repoFullName ??
    "GitHub";

  let updated = applyConnectorSyncToProject(project, "github", result, status, label);

  if (result.trackedRepos && result.trackedRepos.length > 0) {
    updated = {
      ...updated,
      githubTrackedRepos: mergeProjectTrackedRepos(
        updated.githubTrackedRepos,
        result.trackedRepos,
      ),
      githubConnection: undefined,
    };
  } else if (result.connection) {
    updated = {
      ...updated,
      githubConnection: result.connection,
      githubTrackedRepos: mergeProjectTrackedRepos(updated.githubTrackedRepos, [
        {
          repoFullName: result.connection.repoFullName,
          installationId: result.connection.installationId,
          connectedAt: result.connection.connectedAt,
          isPrimary: true,
        },
      ]),
    };
  }

  if (result.productLogo) {
    const withLogo = mergeDetectedProductLogo(updated, result.productLogo);
    if (withLogo) updated = withLogo;
  }

  return updated;
}

export function removeGitHubRepoFromProject(
  project: UserProject,
  repoFullName: string,
  disconnected: boolean,
): UserProject {
  if (disconnected) {
    return {
      ...project,
      githubTrackedRepos: undefined,
      githubConnection: undefined,
      connectorStreams: removeConnectorStream(project.connectorStreams ?? {}, "github"),
      integrations: (project.integrations ?? []).map((i) =>
        i.connectorId === "github" ? { ...i, status: "disconnected" as const } : i,
      ),
    };
  }

  const repos = (project.githubTrackedRepos ?? []).filter(
    (r) => r.repoFullName !== repoFullName,
  );
  const streams = project.connectorStreams ?? {};
  const gh = streams.github;
  let nextStreams = streams;
  if (gh?.type === "github") {
    const repos = { ...gh.repos };
    delete repos[repoFullName];
    const rest = repos;
    if (Object.keys(rest).length === 0) {
      nextStreams = removeConnectorStream(streams, "github");
    } else {
      let primary = gh.primaryRepoFullName;
      if (primary === repoFullName) primary = Object.keys(rest)[0];
      nextStreams = {
        ...streams,
        github: { type: "github", repos: rest, primaryRepoFullName: primary, lastSyncedAt: gh.lastSyncedAt },
      };
    }
  }

  return {
    ...project,
    githubTrackedRepos: repos.length > 0 ? repos : undefined,
    connectorStreams: nextStreams,
  };
}

export function setIntegrationError(
  project: UserProject,
  connectorId: ConnectorId,
  error: string,
): UserProject {
  const integrations = (project.integrations ?? []).map((i) =>
    i.connectorId === connectorId ? { ...i, lastError: error } : i,
  );
  return { ...project, integrations };
}

export function patchIntegrationMeta(
  project: UserProject,
  connectorId: ConnectorId,
  patch: Partial<Integration>,
): UserProject {
  const integrations = (project.integrations ?? []).map((i) =>
    i.connectorId === connectorId ? { ...i, ...patch } : i,
  );
  return { ...project, integrations };
}
