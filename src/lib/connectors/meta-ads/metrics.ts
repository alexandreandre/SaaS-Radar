import "server-only";

import type { ConnectorSyncResult } from "@/lib/connectors/types";
import {
  fetchAdAccountSummary,
  fetchMonthlyInsights,
  validateMetaAdsCredential,
} from "@/lib/connectors/meta-ads/client";
import {
  buildSnapshotsFromInsightRows,
  getMonthKeys,
} from "@/lib/connectors/meta-ads/snapshots";
import type { MetaAdsCredential } from "@/lib/connectors/meta-ads/types";

export async function fetchMetaAdsConnectorSync(
  credential: MetaAdsCredential,
  months = 12,
): Promise<ConnectorSyncResult & { accountLabel: string; updatedCredential?: MetaAdsCredential }> {
  const useFallback = process.env.META_ADS_CONNECTOR_FALLBACK === "1";
  const monthKeys = getMonthKeys(months);

  if (!credential.adAccountId?.trim()) {
    throw new Error("Compte publicitaire Meta non sélectionné");
  }

  if (useFallback) {
    const account = await validateMetaAdsCredential(credential);
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
        source: "meta-ads" as const,
      })),
      syncedAt: new Date().toISOString(),
    };
  }

  const account = await fetchAdAccountSummary(credential, credential.adAccountId);
  const rows = await fetchMonthlyInsights(credential, credential.adAccountId, months);
  const snapshots = buildSnapshotsFromInsightRows(rows, monthKeys);

  return {
    accountLabel: account.name,
    snapshots,
    syncedAt: new Date().toISOString(),
    updatedCredential: account.currencyCode
      ? { ...credential, currencyCode: account.currencyCode }
      : undefined,
  };
}
