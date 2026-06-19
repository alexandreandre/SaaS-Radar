import "server-only";

import { listAllSubscriptions } from "@/lib/connectors/freemius/client";
import { parseAmount } from "@/lib/connectors/freemius/keys";
import {
  buildSnapshotsFromSubscriptions,
  getMonthKeys,
} from "@/lib/connectors/freemius/snapshots";
import type { FreemiusCredential } from "@/lib/connectors/freemius/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";
import type { PaymentStream } from "@/lib/connectors/streams";

export async function buildPaymentStream(
  credential: FreemiusCredential,
): Promise<PaymentStream> {
  try {
    const activeSubs = await listAllSubscriptions(credential, "active");
    let failedPayments = 0;

    for (const sub of activeSubs) {
      const failed = parseAmount(sub.failed_payments);
      const balance = parseAmount(sub.outstanding_balance);
      if (failed > 0 || balance > 0) {
        failedPayments += 1;
      }
    }

    return {
      type: "payment",
      failedPayments,
      recoveredPayments: 0,
    };
  } catch {
    return {
      type: "payment",
      failedPayments: 0,
      recoveredPayments: 0,
    };
  }
}

export async function fetchFreemiusConnectorSync(
  credential: FreemiusCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  const subscriptions = await listAllSubscriptions(credential, "all");
  const monthKeys = getMonthKeys(months);
  const snapshots = buildSnapshotsFromSubscriptions(subscriptions, monthKeys);
  const stream = await buildPaymentStream(credential);

  return {
    snapshots,
    stream,
    accountLabel: credential.productTitle,
    syncedAt: new Date().toISOString(),
  };
}
