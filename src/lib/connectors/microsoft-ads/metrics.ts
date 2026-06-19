import "server-only";

import type { ConnectorSyncResult } from "@/lib/connectors/types";
import {
  fetchAccountSummary,
  validateMicrosoftAdsCredential,
} from "@/lib/connectors/microsoft-ads/client";
import { fetchAccountPerformanceReportCsv } from "@/lib/connectors/microsoft-ads/reporting";
import {
  buildSnapshotsFromReportRows,
  getMonthKeys,
  parseReportCsv,
} from "@/lib/connectors/microsoft-ads/snapshots";
import type { MicrosoftAdsCredential } from "@/lib/connectors/microsoft-ads/types";

export async function fetchMicrosoftAdsConnectorSync(
  credential: MicrosoftAdsCredential,
  months = 12,
): Promise<
  ConnectorSyncResult & { accountLabel: string; updatedCredential?: MicrosoftAdsCredential }
> {
  const useFallback = process.env.MICROSOFT_ADS_CONNECTOR_FALLBACK === "1";
  const monthKeys = getMonthKeys(months);

  if (!credential.accountId?.trim() || !credential.customerId?.trim()) {
    throw new Error("Compte Microsoft Ads non sélectionné");
  }

  if (useFallback) {
    const account = await validateMicrosoftAdsCredential(credential);
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
        source: "microsoft-ads" as const,
      })),
      syncedAt: new Date().toISOString(),
    };
  }

  const account = await fetchAccountSummary(
    credential,
    credential.accountId,
    credential.customerId,
  );
  const csv = await fetchAccountPerformanceReportCsv(credential, months);
  const rows = parseReportCsv(csv);
  const snapshots = buildSnapshotsFromReportRows(rows, monthKeys);

  const updatedCredential: MicrosoftAdsCredential = {
    ...credential,
    accountName: account.name,
    currencyCode: account.currencyCode ?? credential.currencyCode,
  };

  return {
    accountLabel: account.name,
    snapshots,
    syncedAt: new Date().toISOString(),
    updatedCredential,
  };
}
