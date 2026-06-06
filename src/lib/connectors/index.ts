import type { ConnectorId, Integration, MetricsSnapshot } from "@/lib/connectors/types";
import type { ConnectorStreamPayload, ConnectorStreams } from "@/lib/connectors/streams";
import { mergeConnectorStreams, removeConnectorStream } from "@/lib/connectors/streams";
import type { UserProject } from "@/lib/portfolio";
import { getTargetMrr } from "@/lib/portfolio";
import { getConnector } from "@/lib/connectors/registry";
import { generateStreamDemo } from "@/lib/connectors/demo/stream-generators";

export * from "@/lib/connectors/types";
export * from "@/lib/connectors/registry";
export * from "@/lib/connectors/streams";
export * from "@/lib/connectors/sync";

export function mergeSnapshots(
  existing: MetricsSnapshot[],
  incoming: MetricsSnapshot[]
): MetricsSnapshot[] {
  const map = new Map<string, MetricsSnapshot>();

  for (const snap of existing) {
    map.set(snap.date, { ...snap });
  }

  for (const snap of incoming) {
    const prev = map.get(snap.date);
    map.set(snap.date, prev ? { ...prev, ...snap, date: snap.date } : snap);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function syncConnectorDemo(
  project: UserProject,
  connectorId: ConnectorId,
  months = 6
): MetricsSnapshot[] {
  const connector = getConnector(connectorId);
  if (!connector) return [];

  const targetMrr = getTargetMrr(project);
  const seed = `${project.id}:${connectorId}`;
  return connector.demo(seed, months, targetMrr);
}

export function syncConnectorStreamDemo(
  project: UserProject,
  connectorId: ConnectorId
): ConnectorStreamPayload | null {
  const seed = `${project.id}:${connectorId}`;
  const targetMrr = getTargetMrr(project);
  return generateStreamDemo(connectorId, seed, targetMrr);
}

export function syncConnectorAllDemo(
  project: UserProject,
  connectorId: ConnectorId,
  months = 6
): { snapshots: MetricsSnapshot[]; stream: ConnectorStreamPayload | null } {
  return {
    snapshots: syncConnectorDemo(project, connectorId, months),
    stream: syncConnectorStreamDemo(project, connectorId),
  };
}

export function mergeProjectStreams(
  existing: ConnectorStreams | undefined,
  connectorId: ConnectorId,
  stream: ConnectorStreamPayload
): ConnectorStreams {
  return mergeConnectorStreams(existing ?? {}, connectorId, stream);
}

export function hasDemoIntegrations(integrations?: Integration[]): boolean {
  return (integrations ?? []).some((i) => i.status === "demo");
}

export function getConnectedIntegrations(integrations?: Integration[]): Integration[] {
  return (integrations ?? []).filter(
    (i) => i.status === "demo" || i.status === "connected"
  );
}

export function getLatestSnapshot(history?: MetricsSnapshot[]): MetricsSnapshot | null {
  if (!history || history.length === 0) return null;
  return history[history.length - 1];
}

export function getPreviousSnapshot(history?: MetricsSnapshot[]): MetricsSnapshot | null {
  if (!history || history.length < 2) return null;
  return history[history.length - 2];
}

export { removeConnectorStream };
