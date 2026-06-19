import "server-only";

import {
  fetchDealsSummary,
  fetchRecentWonDeals,
} from "@/lib/connectors/pipedrive/client";
import {
  buildCrmStream,
  parseDealCycleDays,
  parseSummaryCount,
  parseSummaryValue,
} from "@/lib/connectors/pipedrive/snapshots";
import type { PipedriveCredential } from "@/lib/connectors/pipedrive/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

function buildFallbackSync(credential: PipedriveCredential): ConnectorSyncResult {
  return {
    stream: {
      type: "crm",
      pipelineValue: 42000,
      dealsWon: 5,
      dealsLost: 2,
      avgCycleDays: 28,
    },
    accountLabel: credential.companyName?.trim() || "Pipedrive",
    syncedAt: new Date().toISOString(),
  };
}

export async function fetchPipedriveConnectorSync(
  credential: PipedriveCredential,
): Promise<ConnectorSyncResult> {
  if (process.env.PIPEDRIVE_CONNECTOR_FALLBACK === "1") {
    return buildFallbackSync(credential);
  }

  const accountLabel = credential.companyName?.trim() || "Pipedrive";

  const [openSummary, wonSummary, lostSummary, wonDeals] = await Promise.all([
    fetchDealsSummary(credential, "open").catch(() => null),
    fetchDealsSummary(credential, "won").catch(() => null),
    fetchDealsSummary(credential, "lost").catch(() => null),
    fetchRecentWonDeals(credential).catch(() => []),
  ]);

  const stream = buildCrmStream({
    pipelineValue: parseSummaryValue(openSummary),
    dealsWon: parseSummaryCount(wonSummary),
    dealsLost: parseSummaryCount(lostSummary),
    avgCycleDays: parseDealCycleDays(wonDeals),
  });

  return {
    stream,
    accountLabel,
    syncedAt: new Date().toISOString(),
    tokenExpiresAt: credential.tokenExpiresAt,
  };
}
