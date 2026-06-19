import "server-only";

import { fetchUptimeMetrics } from "@/lib/connectors/better-stack/client";
import { buildDevStreamFromUptimeMetrics } from "@/lib/connectors/better-stack/streams";
import type { BetterStackCredential } from "@/lib/connectors/better-stack/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function fetchBetterStackConnectorSync(
  credential: BetterStackCredential,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const metrics = await fetchUptimeMetrics(credential);
  const stream = buildDevStreamFromUptimeMetrics(metrics);

  return {
    stream,
    accountLabel: metrics.monitorName,
    syncedAt: new Date().toISOString(),
  };
}
