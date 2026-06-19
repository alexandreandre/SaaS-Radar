import "server-only";

import type { ConnectorSyncResult } from "@/lib/connectors/types";
import {
  aggregateLoopsEventsToSnapshots,
  getMonthKeys,
} from "@/lib/connectors/loops/snapshots";
import {
  fetchLoopsWebhookEvents,
  sinceIsoForMonths,
} from "@/lib/connectors/loops/webhook-store";
import type { LoopsCredential } from "@/lib/connectors/loops/types";

export async function fetchLoopsConnectorSync(
  credential: LoopsCredential,
  projectId: string,
  months = 12,
): Promise<ConnectorSyncResult> {
  const monthKeys = getMonthKeys(months);
  const sinceIso = sinceIsoForMonths(months);
  const events = await fetchLoopsWebhookEvents(projectId, sinceIso);

  const snapshots = aggregateLoopsEventsToSnapshots({
    events,
    monthKeys,
    conversionListId: credential.conversionListId,
    conversionMode: credential.conversionMode,
  });

  return {
    snapshots,
    accountLabel: credential.teamName ?? "Loops",
    syncedAt: new Date().toISOString(),
  };
}
