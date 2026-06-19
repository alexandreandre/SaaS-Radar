import type { ConnectorId } from "@/lib/connectors/types";

export type FinanceStream = {
  type: "finance";
  cashBalance: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  runwayDays: number;
};

export type AccountingStream = {
  type: "accounting";
  revenueBooked: number;
  expensesBooked: number;
  vatDue: number;
};

export type ProductStream = {
  type: "product";
  activationRate: number;
  retentionD7: number;
  featureUsageTop: string;
};

export type SupportStream = {
  type: "support";
  openTickets: number;
  avgResponseHours: number;
  csat: number;
};

export type DevStream = {
  type: "dev";
  deploysLast30d: number;
  openIssues: number;
  errorRate: number;
  uptimePct: number;
  commitsLast7d?: number;
  commitsDelta?: number;
  openPrs?: number;
  stars?: number;
  lastWorkflowConclusion?: string | null;
  viewsLast14d?: number;
  defaultBranch?: string;
  lastPushAt?: string | null;
  repoFullName?: string;
  healthScore?: number;
  deploymentUrl?: string;
  lastDeploymentState?: string | null;
  lastDeploymentAt?: string;
  infraCostMonthly?: number;
};

export type CrmStream = {
  type: "crm";
  pipelineValue: number;
  dealsWon: number;
  dealsLost: number;
  avgCycleDays: number;
};

export type CommsStream = {
  type: "comms";
  alertsSent: number;
  lastAlertAt: string;
};

export type PaymentStream = {
  type: "payment";
  failedPayments: number;
  recoveredPayments: number;
};

export type GitHubMultiStream = {
  type: "github";
  primaryRepoFullName?: string;
  repos: Record<string, DevStream>;
  lastSyncedAt?: string;
};

export type ConnectorStreamPayload =
  | FinanceStream
  | AccountingStream
  | ProductStream
  | SupportStream
  | DevStream
  | GitHubMultiStream
  | CrmStream
  | CommsStream
  | PaymentStream;

export type ConnectorStreams = Partial<Record<ConnectorId, ConnectorStreamPayload>>;

export function getStreamType(
  payload: ConnectorStreamPayload
): ConnectorStreamPayload["type"] {
  return payload.type;
}

export function mergeConnectorStreams(
  existing: ConnectorStreams,
  connectorId: ConnectorId,
  stream: ConnectorStreamPayload
): ConnectorStreams {
  return { ...existing, [connectorId]: stream };
}

export function removeConnectorStream(
  streams: ConnectorStreams,
  connectorId: ConnectorId
): ConnectorStreams {
  const next = { ...streams };
  delete next[connectorId];
  return next;
}

const PRODUCT_ANALYTICS_IDS: ConnectorId[] = ["posthog", "mixpanel", "fathom", "plausible"];

export function getProductStream(streams: ConnectorStreams = {}): ProductStream | undefined {
  for (const id of PRODUCT_ANALYTICS_IDS) {
    const payload = streams[id];
    if (payload?.type === "product") return payload;
  }
  return undefined;
}

export function hasProductAnalyticsConnected(integrations: { connectorId: ConnectorId; status: string }[] = []) {
  return integrations.some(
    (i) =>
      PRODUCT_ANALYTICS_IDS.includes(i.connectorId) &&
      (i.status === "demo" || i.status === "connected")
  );
}

export function isGitHubMultiStream(
  stream: ConnectorStreamPayload | undefined,
): stream is GitHubMultiStream {
  return stream?.type === "github";
}

export function isLegacyGitHubDevStream(
  stream: ConnectorStreamPayload | undefined,
): stream is DevStream {
  return stream?.type === "dev" && Boolean(stream.repoFullName);
}

export function normalizeGitHubStreamPayload(
  stream: ConnectorStreamPayload | undefined,
): GitHubMultiStream | undefined {
  if (!stream) return undefined;
  if (isGitHubMultiStream(stream)) return stream;
  if (isLegacyGitHubDevStream(stream) && stream.repoFullName) {
    return {
      type: "github",
      primaryRepoFullName: stream.repoFullName,
      repos: { [stream.repoFullName]: stream },
    };
  }
  return undefined;
}

export function getGitHubRepoStream(
  stream: ConnectorStreamPayload | undefined,
  repoFullName: string,
): DevStream | undefined {
  const multi = normalizeGitHubStreamPayload(stream);
  return multi?.repos[repoFullName];
}

export function getGitHubStreamsList(
  stream: ConnectorStreamPayload | undefined,
): DevStream[] {
  const multi = normalizeGitHubStreamPayload(stream);
  if (!multi) return [];
  return Object.values(multi.repos);
}

export function getGitHubPrimaryRepoStream(
  stream: ConnectorStreamPayload | undefined,
): DevStream | undefined {
  const multi = normalizeGitHubStreamPayload(stream);
  if (!multi) return undefined;
  if (multi.primaryRepoFullName && multi.repos[multi.primaryRepoFullName]) {
    return multi.repos[multi.primaryRepoFullName];
  }
  const keys = Object.keys(multi.repos);
  return keys.length > 0 ? multi.repos[keys[0]!] : undefined;
}

export function mergeGitHubMultiStream(
  existing: ConnectorStreamPayload | undefined,
  repoFullName: string,
  repoStream: DevStream,
  opts?: { primaryRepoFullName?: string; lastSyncedAt?: string },
): GitHubMultiStream {
  const base = normalizeGitHubStreamPayload(existing) ?? {
    type: "github" as const,
    repos: {},
  };
  const repos = { ...base.repos, [repoFullName]: { ...repoStream, repoFullName } };
  const primary =
    opts?.primaryRepoFullName ??
    base.primaryRepoFullName ??
    (Object.keys(repos).length === 1 ? repoFullName : base.primaryRepoFullName);

  return {
    type: "github",
    primaryRepoFullName: primary && repos[primary] ? primary : Object.keys(repos)[0],
    repos,
    lastSyncedAt: opts?.lastSyncedAt ?? base.lastSyncedAt,
  };
}
