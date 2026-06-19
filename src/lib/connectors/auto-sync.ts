import { integrationNeedsAction } from "@/lib/connectors/integration-health";
import type { ConnectorId, Integration } from "@/lib/connectors/types";

/** Intervalle minimum entre deux syncs auto pour un même connecteur. */
export const AUTO_SYNC_MIN_INTERVAL_MS = 60 * 60 * 1000;

/** Intervalle minimum entre deux tentatives auto-sync globales par projet (session). */
export const AUTO_SYNC_SESSION_COOLDOWN_MS = 5 * 60 * 1000;

function syncAgeMs(integration: Integration, now: number): number | null {
  if (!integration.lastSyncAt) return null;
  const at = new Date(integration.lastSyncAt).getTime();
  if (Number.isNaN(at)) return null;
  return now - at;
}

export function shouldAutoSync(
  integration: Integration,
  opts?: { force?: boolean; now?: number },
): boolean {
  if (opts?.force) {
    return integration.status === "connected" && !integrationNeedsAction(integration);
  }

  if (integration.status !== "connected") return false;
  if (integrationNeedsAction(integration)) return false;

  const now = opts?.now ?? Date.now();
  const age = syncAgeMs(integration, now);
  if (age === null) return true;
  return age >= AUTO_SYNC_MIN_INTERVAL_MS;
}

export function listAutoSyncableIntegrations(
  integrations: Integration[] = [],
  opts?: { force?: boolean; now?: number },
): Integration[] {
  return integrations.filter((integration) => shouldAutoSync(integration, opts));
}

export function listAutoSyncableConnectorIds(
  integrations: Integration[] = [],
  opts?: { force?: boolean; now?: number },
): ConnectorId[] {
  return listAutoSyncableIntegrations(integrations, opts).map((i) => i.connectorId);
}
