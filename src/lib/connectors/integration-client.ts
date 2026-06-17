import {
  mergeSnapshots,
  mergeProjectStreams,
} from "@/lib/connectors";
import type { ConnectorId, Integration, MetricsSnapshot } from "@/lib/connectors/types";
import type { ConnectorStreamPayload } from "@/lib/connectors/streams";
import { PAYMENT_CONNECTOR_IDS } from "@/lib/revenue-helpers";
import type { UserProject } from "@/lib/portfolio";

export type ConnectorSyncApiResponse = {
  accountLabel?: string;
  snapshots?: MetricsSnapshot[];
  stream?: ConnectorStreamPayload | null;
  syncedAt?: string;
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

  const entry: Integration = {
    connectorId,
    status,
    connectedAt: integrations[idx]?.connectedAt ?? now,
    lastSyncAt: now,
    accountLabel,
    syncSchedule: "manual",
    lastError: undefined,
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
