import "server-only";

import {
  countUnresolvedConversations,
  generateAnalytics,
} from "@/lib/connectors/crisp/client";
import {
  buildDateRangeForMonths,
  buildLast30DaysRange,
  buildSupportStream,
  extractAnalyticsPoints,
  getMonthKeys,
  mapVisitorAnalyticsToSnapshots,
} from "@/lib/connectors/crisp/snapshots";
import type { CrispCredential } from "@/lib/connectors/crisp/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

function buildFallbackSync(credential: CrispCredential): ConnectorSyncResult {
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
    activeUsers: 40 + index * 3,
    mau: 40 + index * 3,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    source: "crisp" as const,
  }));

  return {
    snapshots,
    stream: {
      type: "support",
      openTickets: 4,
      avgResponseHours: 3.5,
      csat: 82,
    },
    accountLabel: credential.websiteName?.trim() || credential.websiteId,
    syncedAt: new Date().toISOString(),
  };
}

export async function fetchCrispConnectorSync(
  credential: CrispCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  if (process.env.CRISP_CONNECTOR_FALLBACK === "1") {
    return buildFallbackSync(credential);
  }

  const timezone = credential.timezone ?? "Europe/Paris";
  const monthKeys = getMonthKeys(months);
  const monthlyRange = buildDateRangeForMonths(months);
  const last30 = buildLast30DaysRange();

  const [visitorAnalytics, responseAnalytics, ratingAnalytics, openTickets] = await Promise.all([
    generateAnalytics(credential.websiteId, {
      metric: "visitor_visit",
      type: "unique",
      date: {
        from: monthlyRange.from,
        to: monthlyRange.to,
        split: "monthly",
        timezone,
      },
    }).catch(() => ({ data: [] })),
    generateAnalytics(credential.websiteId, {
      metric: "conversation",
      type: "response_time",
      aggregator: "average",
      date: {
        from: last30.from,
        to: last30.to,
        split: "all",
        timezone,
      },
    }).catch(() => ({ data: [] })),
    generateAnalytics(credential.websiteId, {
      metric: "conversation",
      type: "rating",
      aggregator: "average",
      date: {
        from: last30.from,
        to: last30.to,
        split: "all",
        timezone,
      },
    }).catch(() => ({ data: [] })),
    countUnresolvedConversations(credential.websiteId).catch(() => 0),
  ]);

  const snapshots = mapVisitorAnalyticsToSnapshots({
    monthKeys,
    points: extractAnalyticsPoints(visitorAnalytics),
  });

  const stream = buildSupportStream({
    openTickets,
    responseTimePoints: extractAnalyticsPoints(responseAnalytics),
    ratingPoints: extractAnalyticsPoints(ratingAnalytics),
  });

  return {
    snapshots,
    stream,
    accountLabel: credential.websiteName?.trim() || credential.websiteId,
    syncedAt: new Date().toISOString(),
  };
}
