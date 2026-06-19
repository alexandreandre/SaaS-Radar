import "server-only";

import {
  classifyPipelineStages,
  buildHubSpotCrmStream,
  CYCLE_WINDOW_DAYS,
  hubSpotFilterTimestamp,
  WON_LOST_WINDOW_DAYS,
  windowStartMs,
} from "@/lib/connectors/hubspot/crm-stream";
import {
  fetchDealPipelines,
  searchDealsInStages,
} from "@/lib/connectors/hubspot/client";
import type { HubSpotCredential } from "@/lib/connectors/hubspot/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

function buildFallbackSync(credential: HubSpotCredential): ConnectorSyncResult {
  return {
    stream: {
      type: "crm",
      pipelineValue: 42000,
      dealsWon: 3,
      dealsLost: 1,
      avgCycleDays: 28,
    },
    accountLabel: credential.portalLabel?.trim() || credential.hubId || "HubSpot",
    syncedAt: new Date().toISOString(),
  };
}

export async function fetchHubSpotConnectorSync(
  credential: HubSpotCredential,
): Promise<ConnectorSyncResult> {
  if (process.env.HUBSPOT_CONNECTOR_FALLBACK === "1") {
    return buildFallbackSync(credential);
  }

  const accessToken = credential.accessToken;
  const now = Date.now();
  const wonLostStart = hubSpotFilterTimestamp(windowStartMs(WON_LOST_WINDOW_DAYS, now));
  const cycleStart = hubSpotFilterTimestamp(windowStartMs(CYCLE_WINDOW_DAYS, now));

  const pipelinesResponse = await fetchDealPipelines(accessToken);
  const classification = classifyPipelineStages(pipelinesResponse.results ?? []);

  const [openDeals, wonDeals30d, lostDeals30d, wonDeals90dForCycle] = await Promise.all([
    searchDealsInStages(accessToken, classification.openStageIds),
    searchDealsInStages(accessToken, classification.wonStageIds, [
      {
        propertyName: "closedate",
        operator: "GTE",
        value: wonLostStart,
      },
    ]),
    searchDealsInStages(accessToken, classification.lostStageIds, [
      {
        propertyName: "closedate",
        operator: "GTE",
        value: wonLostStart,
      },
    ]),
    searchDealsInStages(accessToken, classification.wonStageIds, [
      {
        propertyName: "closedate",
        operator: "GTE",
        value: cycleStart,
      },
    ]),
  ]);

  const stream = buildHubSpotCrmStream({
    openDeals,
    wonDeals30d,
    lostDeals30d,
    wonDeals90dForCycle,
  });

  return {
    stream,
    accountLabel: credential.portalLabel?.trim() || credential.hubId || "HubSpot",
    syncedAt: new Date().toISOString(),
  };
}
