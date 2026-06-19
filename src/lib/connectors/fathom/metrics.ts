import "server-only";

import { runAggregation } from "@/lib/connectors/fathom/client";
import {
  aggregateDailyVisitsToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromAggregationResults,
  getMonthKeys,
  parseMonthlySignups,
  parseMonthlyVisits,
  splitDateRangeForDailyQueries,
} from "@/lib/connectors/fathom/snapshots";
import type { FathomCredential } from "@/lib/connectors/fathom/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

async function fetchDailyVisits(
  credential: FathomCredential,
  dateFrom: string,
  dateTo: string,
): Promise<ReturnType<typeof aggregateDailyVisitsToDau>> {
  const windows = splitDateRangeForDailyQueries(dateFrom, dateTo);
  const allRows: Awaited<ReturnType<typeof runAggregation>> = [];

  for (const [from, to] of windows) {
    const rows = await runAggregation(credential, {
      entity: "pageview",
      entity_id: credential.siteId,
      aggregates: "visits",
      date_grouping: "day",
      date_from: from,
      date_to: to,
      sort_by: "timestamp:asc",
    });
    allRows.push(...rows);
  }

  return aggregateDailyVisitsToDau(allRows);
}

export async function fetchFathomConnectorSync(
  credential: FathomCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  const monthKeys = getMonthKeys(months);
  const [dateFrom, dateTo] = buildDateRangeForMonths(months);

  const monthlyRows = await runAggregation(credential, {
    entity: "pageview",
    entity_id: credential.siteId,
    aggregates: "visits",
    date_grouping: "month",
    date_from: dateFrom,
    date_to: dateTo,
    sort_by: "timestamp:asc",
  });

  const dauByMonth = await fetchDailyVisits(credential, dateFrom, dateTo);

  const signupRows = credential.signupEventId
    ? await runAggregation(credential, {
        entity: "event",
        site_id: credential.siteId,
        entity_name: credential.signupEventId,
        aggregates: "unique_conversions",
        date_grouping: "month",
        date_from: dateFrom,
        date_to: dateTo,
        sort_by: "timestamp:asc",
      })
    : [];

  const snapshots = buildSnapshotsFromAggregationResults({
    monthKeys,
    monthlyVisits: parseMonthlyVisits(monthlyRows),
    dauByMonth,
    signupsByMonth: parseMonthlySignups(signupRows),
  });

  return {
    snapshots,
    syncedAt: new Date().toISOString(),
  };
}
