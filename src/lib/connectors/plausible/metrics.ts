import "server-only";

import { runStatsQuery } from "@/lib/connectors/plausible/client";
import {
  aggregateDailyVisitorsToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromQueryResults,
  getMonthKeys,
  parseMonthlySignups,
  parseMonthlyVisitors,
} from "@/lib/connectors/plausible/snapshots";
import type { PlausibleCredential } from "@/lib/connectors/plausible/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function fetchPlausibleConnectorSync(
  credential: PlausibleCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  const monthKeys = getMonthKeys(months);
  const dateRange = buildDateRangeForMonths(months);

  const monthlyQuery = runStatsQuery(credential, {
    site_id: credential.siteId,
    metrics: ["visitors"],
    date_range: dateRange,
    dimensions: ["time:month"],
  });

  const dailyQuery = runStatsQuery(credential, {
    site_id: credential.siteId,
    metrics: ["visitors"],
    date_range: dateRange,
    dimensions: ["time:day"],
    include: { time_labels: true },
  });

  const signupQuery = credential.signupGoalDisplayName
    ? runStatsQuery(credential, {
        site_id: credential.siteId,
        metrics: ["events"],
        date_range: dateRange,
        dimensions: ["time:month"],
        filters: [["is", "event:goal", [credential.signupGoalDisplayName]]],
      })
    : Promise.resolve({ results: [] });

  const [monthlyRes, dailyRes, signupRes] = await Promise.all([
    monthlyQuery,
    dailyQuery,
    signupQuery,
  ]);

  const snapshots = buildSnapshotsFromQueryResults({
    monthKeys,
    monthlyVisitors: parseMonthlyVisitors(monthlyRes.results ?? []),
    dauByMonth: aggregateDailyVisitorsToDau(dailyRes.results ?? []),
    signupsByMonth: parseMonthlySignups(signupRes.results ?? []),
  });

  return {
    snapshots,
    accountLabel: credential.siteId,
    syncedAt: new Date().toISOString(),
  };
}
