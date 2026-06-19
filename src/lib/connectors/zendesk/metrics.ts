import "server-only";

import {
  countActiveEndUsersInMonth,
  countOpenTickets,
  fetchCsatMetrics,
  fetchRecentTicketMetrics,
} from "@/lib/connectors/zendesk/client";
import {
  buildZendeskSupportStream,
  computeCsatPercent,
  getMonthKeys,
  last30DaysUnixRange,
  mapEndUserCountsToSnapshots,
  medianReplyHours,
} from "@/lib/connectors/zendesk/snapshots";
import type { ZendeskCredential } from "@/lib/connectors/zendesk/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

function buildFallbackSync(credential: ZendeskCredential): ConnectorSyncResult {
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
    activeUsers: 30 + index * 5,
    mau: 30 + index * 5,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    source: "zendesk" as const,
  }));

  return {
    snapshots,
    stream: {
      type: "support",
      openTickets: 5,
      avgResponseHours: 4.5,
      csat: 82,
    },
    accountLabel: credential.accountName?.trim() || credential.subdomain,
    syncedAt: new Date().toISOString(),
  };
}

export async function fetchZendeskConnectorSync(
  credential: ZendeskCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  if (process.env.ZENDESK_CONNECTOR_FALLBACK === "1") {
    return buildFallbackSync(credential);
  }

  const monthKeys = getMonthKeys(months);
  const last30 = last30DaysUnixRange();
  const accountLabel = credential.accountName?.trim() || credential.subdomain;

  const [openTickets, csatMetrics, ticketMetrics, ...monthlyCounts] = await Promise.all([
    countOpenTickets(credential).catch(() => 0),
    fetchCsatMetrics(credential, last30).catch(() => ({ good: 0, bad: 0 })),
    fetchRecentTicketMetrics(credential).catch(() => []),
    ...monthKeys.map((monthKey) =>
      countActiveEndUsersInMonth(credential, monthKey).catch(() => 0),
    ),
  ]);

  const countsByMonth = new Map<string, number>();
  monthKeys.forEach((monthKey, index) => {
    countsByMonth.set(monthKey, monthlyCounts[index] ?? 0);
  });

  const snapshots = mapEndUserCountsToSnapshots({ monthKeys, countsByMonth });
  const stream = buildZendeskSupportStream({
    openTickets,
    avgResponseHours: medianReplyHours(ticketMetrics),
    csat: computeCsatPercent(csatMetrics.good, csatMetrics.bad),
  });

  return {
    snapshots,
    stream,
    accountLabel,
    syncedAt: new Date().toISOString(),
  };
}
