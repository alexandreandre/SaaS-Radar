import type { ConnectorId, ConnectorSyncResult } from "@/lib/connectors/types";

/**
 * Real OAuth/API sync entry point — wired via `/api/connectors/[id]/sync`.
 * Stripe sync is implemented server-side in lib/connectors/stripe/metrics.ts.
 */
export async function syncConnectorReal(
  _project: unknown,
  connectorId: ConnectorId
): Promise<ConnectorSyncResult> {
  if (connectorId !== "stripe") {
    throw new Error(`syncConnectorReal: OAuth/API sync not implemented for ${connectorId}`);
  }
  throw new Error("syncConnectorReal: appeler /api/connectors/stripe/sync côté serveur");
}
