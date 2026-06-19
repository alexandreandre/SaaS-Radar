import "server-only";

import {
  batchRunAnalyticsReports,
  buildAccountLabel,
} from "@/lib/connectors/google-analytics/client";
import {
  aggregateDailyActiveUsersToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromReports,
  getMonthKeys,
  parseYearMonthMetricRows,
} from "@/lib/connectors/google-analytics/snapshots";
import type { GoogleAnalyticsCredential } from "@/lib/connectors/google-analytics/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function fetchGoogleAnalyticsConnectorSync(
  credential: GoogleAnalyticsCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  if (!credential.propertyId) {
    throw new Error("Propriété GA4 non configurée");
  }

  const monthKeys = getMonthKeys(months);
  const [startDate, endDate] = buildDateRangeForMonths(months);

  const reports = await batchRunAnalyticsReports(credential, {
    propertyId: credential.propertyId,
    startDate,
    endDate,
    signupEvent: credential.signupEvent,
    trialEvent: credential.trialEvent,
  });

  const mauReport = reports[0];
  const dauReport = reports[1];
  let signupReportIndex = 2;
  const signupsReport = credential.signupEvent ? reports[signupReportIndex] : undefined;
  if (credential.signupEvent) signupReportIndex += 1;
  const trialsReport = credential.trialEvent ? reports[signupReportIndex] : undefined;

  const snapshots = buildSnapshotsFromReports({
    monthKeys,
    mauByMonth: parseYearMonthMetricRows(mauReport?.rows ?? []),
    dauByMonth: aggregateDailyActiveUsersToDau(dauReport?.rows ?? []),
    signupsByMonth: parseYearMonthMetricRows(signupsReport?.rows ?? []),
    trialsByMonth: parseYearMonthMetricRows(trialsReport?.rows ?? []),
  });

  return {
    snapshots,
    accountLabel: buildAccountLabel(credential),
    syncedAt: new Date().toISOString(),
  };
}
