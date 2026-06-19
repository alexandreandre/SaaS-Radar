import "server-only";

import {
  countPastDueSubscriptions,
  countPastDueTransactions,
  fetchActiveSubscribersMetrics,
  fetchMrrMetrics,
  listRecentCompletedTransactions,
  listSubscriptions,
} from "@/lib/connectors/paddle/client";
import {
  buildSnapshotsFromMetrics,
  buildSnapshotsFromSubscriptions,
  getMonthKeys,
  mergeMetricAndSubscriptionSnapshots,
  metricsDateRange,
} from "@/lib/connectors/paddle/snapshots";
import type { PaddleCredential } from "@/lib/connectors/paddle/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";
import type { PaymentStream } from "@/lib/connectors/streams";

const RECOVERED_ERROR_STATUSES = new Set([
  "error",
  "authentication_failed",
  "declined",
  "canceled",
]);

function countRecoveredPayments(
  transactions: Awaited<ReturnType<typeof listRecentCompletedTransactions>>,
): number {
  let recovered = 0;
  for (const txn of transactions) {
    const payments = txn.attributes.payments ?? [];
    const hadFailure = payments.some((p) => RECOVERED_ERROR_STATUSES.has(p.status));
    const hasCaptured = payments.some((p) => p.status === "captured");
    if (hadFailure && hasCaptured) recovered += 1;
  }
  return recovered;
}

export async function buildPaymentStream(credential: PaddleCredential): Promise<PaymentStream> {
  try {
    const [pastDueSubs, pastDueTxns, recentCompleted] = await Promise.all([
      countPastDueSubscriptions(credential),
      countPastDueTransactions(credential),
      listRecentCompletedTransactions(
        credential,
        new Date(Date.now() - 30 * 86400000).toISOString(),
      ),
    ]);

    return {
      type: "payment",
      failedPayments: pastDueSubs + pastDueTxns,
      recoveredPayments: countRecoveredPayments(recentCompleted),
    };
  } catch {
    return {
      type: "payment",
      failedPayments: 0,
      recoveredPayments: 0,
    };
  }
}

export async function fetchPaddleConnectorSync(
  credential: PaddleCredential,
  options: { metricsAvailable?: boolean; months?: number } = {},
): Promise<ConnectorSyncResult> {
  const months = options.months ?? 12;
  const monthKeys = getMonthKeys(months);
  const { from, to } = metricsDateRange(monthKeys);
  const metricsAvailable = options.metricsAvailable ?? true;

  let snapshots;
  let currency = credential.currency;

  if (metricsAvailable) {
    const [mrrResponse, subsResponse, subscriptions] = await Promise.all([
      fetchMrrMetrics(credential, from, to),
      fetchActiveSubscribersMetrics(credential, from, to),
      listSubscriptions(credential),
    ]);

    if (mrrResponse.data.currency_code) {
      currency = mrrResponse.data.currency_code;
    }

    const metricsSnapshots = buildSnapshotsFromMetrics(
      mrrResponse.data.timeseries,
      subsResponse.data.timeseries,
      monthKeys,
    );
    const subscriptionSnapshots = buildSnapshotsFromSubscriptions(subscriptions, monthKeys);
    snapshots = mergeMetricAndSubscriptionSnapshots(metricsSnapshots, subscriptionSnapshots);
  } else {
    const subscriptions = await listSubscriptions(credential);
    if (subscriptions[0]?.attributes.currency_code) {
      currency = subscriptions[0].attributes.currency_code;
    }
    snapshots = buildSnapshotsFromSubscriptions(subscriptions, monthKeys);
  }

  const stream = await buildPaymentStream(credential);

  return {
    snapshots,
    stream,
    accountLabel: credential.sandbox
      ? `Paddle · Sandbox (${currency})`
      : `Paddle · Live (${currency})`,
    syncedAt: new Date().toISOString(),
  };
}
