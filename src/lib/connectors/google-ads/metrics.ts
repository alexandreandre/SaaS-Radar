import "server-only";

import type { ConnectorSyncResult } from "@/lib/connectors/types";
import {
  fetchCustomerSummary,
  runGaqlQuery,
  validateGoogleAdsCredential,
} from "@/lib/connectors/google-ads/client";
import {
  buildMonthlyMetricsQuery,
  buildSnapshotsFromGaqlRows,
  getMonthKeys,
} from "@/lib/connectors/google-ads/snapshots";
import type { GoogleAdsCredential } from "@/lib/connectors/google-ads/types";

export async function fetchGoogleAdsConnectorSync(
  credential: GoogleAdsCredential,
  months = 12,
): Promise<ConnectorSyncResult & { accountLabel: string; updatedCredential?: GoogleAdsCredential }> {
  const useFallback = process.env.GOOGLE_ADS_CONNECTOR_FALLBACK === "1";
  const monthKeys = getMonthKeys(months);

  if (!credential.customerId?.trim()) {
    throw new Error("Compte Google Ads non sélectionné");
  }

  if (useFallback) {
    const account = await validateGoogleAdsCredential(credential);
    return {
      accountLabel: account.descriptiveName,
      snapshots: monthKeys.map((date) => ({
        date,
        mrr: 0,
        newMrr: 0,
        expansionMrr: 0,
        churnedMrr: 0,
        customers: 0,
        signups: 0,
        trials: 0,
        activeUsers: 0,
        mau: 0,
        dau: 0,
        adSpend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        source: "google-ads" as const,
      })),
      syncedAt: new Date().toISOString(),
    };
  }

  const account = await fetchCustomerSummary(credential, credential.customerId);
  const rows = await runGaqlQuery(
    credential,
    credential.customerId,
    buildMonthlyMetricsQuery(months),
  );
  const snapshots = buildSnapshotsFromGaqlRows(rows, monthKeys);

  return {
    accountLabel: account.descriptiveName,
    snapshots,
    syncedAt: new Date().toISOString(),
    updatedCredential: account.currencyCode
      ? { ...credential, currencyCode: account.currencyCode }
      : undefined,
  };
}
