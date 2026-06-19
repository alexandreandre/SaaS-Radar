import "server-only";

import type { ConnectorSyncResult } from "@/lib/connectors/types";
import {
  fetchAdvertiserSummary,
  fetchMonthlyReportRows,
  validateTikTokAdsCredential,
} from "@/lib/connectors/tiktok-ads/client";
import {
  buildSnapshotsFromReportRows,
  getMonthKeys,
} from "@/lib/connectors/tiktok-ads/snapshots";
import type { TikTokAdsCredential } from "@/lib/connectors/tiktok-ads/types";

export async function fetchTikTokAdsConnectorSync(
  credential: TikTokAdsCredential,
  months = 12,
): Promise<ConnectorSyncResult & { accountLabel: string; updatedCredential?: TikTokAdsCredential }> {
  const useFallback = process.env.TIKTOK_ADS_CONNECTOR_FALLBACK === "1";
  const monthKeys = getMonthKeys(months);

  if (!credential.advertiserId?.trim()) {
    throw new Error("Compte publicitaire TikTok non sélectionné");
  }

  if (useFallback) {
    const account = await validateTikTokAdsCredential(credential);
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
        source: "tiktok-ads" as const,
      })),
      syncedAt: new Date().toISOString(),
    };
  }

  const account = await fetchAdvertiserSummary(credential, credential.advertiserId);
  const rows = await fetchMonthlyReportRows(credential, credential.advertiserId, months);
  const snapshots = buildSnapshotsFromReportRows(rows, monthKeys);

  return {
    accountLabel: account.name,
    snapshots,
    syncedAt: new Date().toISOString(),
    updatedCredential: account.currencyCode
      ? { ...credential, currencyCode: account.currencyCode }
      : undefined,
  };
}
