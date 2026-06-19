import "server-only";

import {
  countActiveContactsInRange,
  countOpenConversations,
  fetchConversationsForMedianResponse,
  fetchCsatMetrics,
} from "@/lib/connectors/intercom/client";
import {
  buildIntercomSupportStream,
  computeCsatPercent,
  getMonthKeys,
  last30DaysUnixRange,
  mapContactsCountsToSnapshots,
  medianResponseHours,
  monthUnixRange,
} from "@/lib/connectors/intercom/snapshots";
import type { IntercomCredential } from "@/lib/connectors/intercom/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

function buildFallbackSync(credential: IntercomCredential): ConnectorSyncResult {
  const monthKeys = getMonthKeys(12);
  const snapshots = monthKeys.map((date, index) => ({
    date,
    mrr: 0,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    customers: 0,
    signups: 0,
    trials: 0,
    activeUsers: 35 + index * 4,
    mau: 35 + index * 4,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    source: "intercom" as const,
  }));

  return {
    snapshots,
    stream: {
      type: "support",
      openTickets: 6,
      avgResponseHours: 4.2,
      csat: 84,
    },
    accountLabel: credential.appName?.trim() || credential.appId,
    syncedAt: new Date().toISOString(),
  };
}

export async function fetchIntercomConnectorSync(
  credential: IntercomCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  if (process.env.INTERCOM_CONNECTOR_FALLBACK === "1") {
    return buildFallbackSync(credential);
  }

  const monthKeys = getMonthKeys(months);
  const last30 = last30DaysUnixRange();
  const accountLabel = credential.appName?.trim() || credential.appId;

  const [openTickets, csatMetrics, responseConversations, ...monthlyCounts] =
    await Promise.all([
      countOpenConversations(credential).catch(() => 0),
      fetchCsatMetrics(credential, last30).catch(() => ({ rated4Plus: 0, totalRated: 0 })),
      fetchConversationsForMedianResponse(credential, last30).catch(() => []),
      ...monthKeys.map((monthKey) =>
        countActiveContactsInRange(credential, monthUnixRange(monthKey)).catch(() => 0),
      ),
    ]);

  const countsByMonth = new Map<string, number>();
  monthKeys.forEach((monthKey, index) => {
    countsByMonth.set(monthKey, monthlyCounts[index] ?? 0);
  });

  const snapshots = mapContactsCountsToSnapshots({ monthKeys, countsByMonth });
  const stream = buildIntercomSupportStream({
    openTickets,
    avgResponseHours: medianResponseHours(responseConversations),
    csat: computeCsatPercent(csatMetrics.rated4Plus, csatMetrics.totalRated),
  });

  return {
    snapshots,
    stream,
    accountLabel,
    syncedAt: new Date().toISOString(),
  };
}
