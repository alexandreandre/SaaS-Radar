import "server-only";

import type { ConnectorSyncResult } from "@/lib/connectors/types";
import {
  fetchAdAccountSummary,
  fetchMonthlyAnalyticsRows,
  validateLinkedInAdsCredential,
} from "@/lib/connectors/linkedin-ads/client";
import {
  buildSnapshotsFromAnalyticsRows,
  getMonthKeys,
} from "@/lib/connectors/linkedin-ads/snapshots";
import type { LinkedInAdsCredential } from "@/lib/connectors/linkedin-ads/types";

export async function fetchLinkedInAdsConnectorSync(
  credential: LinkedInAdsCredential,
  months = 12,
): Promise<
  ConnectorSyncResult & { accountLabel: string; updatedCredential?: LinkedInAdsCredential }
> {
  const useFallback = process.env.LINKEDIN_ADS_CONNECTOR_FALLBACK === "1";
  const monthKeys = getMonthKeys(months);

  if (!credential.adAccountId?.trim()) {
    throw new Error("Compte publicitaire LinkedIn non sélectionné");
  }

  if (useFallback) {
    const account = await validateLinkedInAdsCredential(credential);
    return {
      accountLabel: account.name,
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
        source: "linkedin-ads" as const,
      })),
      syncedAt: new Date().toISOString(),
    };
  }

  const account = await fetchAdAccountSummary(credential, credential.adAccountId);
  const rows = await fetchMonthlyAnalyticsRows(credential, credential.adAccountId, months);
  const snapshots = buildSnapshotsFromAnalyticsRows(rows, monthKeys);

  const updatedCredential: LinkedInAdsCredential = {
    ...credential,
    accountName: account.name,
    adAccountUrn: account.adAccountUrn,
    currencyCode: account.currencyCode ?? credential.currencyCode,
  };

  return {
    accountLabel: account.name,
    snapshots,
    syncedAt: new Date().toISOString(),
    updatedCredential,
  };
}
