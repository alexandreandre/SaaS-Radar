import type { ConnectorId, ConnectorSyncResult } from "@/lib/connectors/types";
import type { UserProject } from "@/lib/portfolio";

/**
 * Real OAuth/API sync entry point — to be wired to `/api/connectors/[id]/sync`.
 * Currently throws; demo mode uses syncConnectorDemo instead.
 */
export async function syncConnectorReal(
  project: UserProject,
  connectorId: ConnectorId
): Promise<ConnectorSyncResult> {
  void project;
  void connectorId;
  throw new Error("syncConnectorReal: OAuth/API sync not implemented yet");
}
