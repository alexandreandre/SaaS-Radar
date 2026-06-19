import "server-only";

import type { ConnectorSyncResult } from "@/lib/connectors/types";
import type { PaymentStream } from "@/lib/connectors/streams";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import {
  fetchGrowthByChangeType,
  fetchMrrSeries,
  getMonthKeys,
  probeAnalyticsAccess,
} from "@/lib/connectors/stripe/analytics";
import { stripeConnectorRequest } from "@/lib/connectors/stripe/client";
import type { LastSnapshotMeta } from "@/lib/connectors/stripe/errors";
import {
  buildSnapshotsFromAnalytics,
  buildSnapshotsFromV1,
} from "@/lib/connectors/stripe/snapshots";
import type { StripeCredential } from "@/lib/connectors/stripe/types";
import {
  countUniqueActiveCustomers,
  fetchCurrentMrrFromSubscriptions,
  fetchInvoiceMrrByMonth,
  fetchSubscriptionGrowthByMonth,
} from "@/lib/connectors/stripe/v1-metrics";

type StripeListResponse<T> = {
  data: T[];
  has_more: boolean;
};

type StripeSubscription = { id: string; status: string };
type StripeInvoice = {
  id: string;
  status: string | null;
  attempt_count?: number;
  paid?: boolean;
};

export type StripeConnectorSyncOptions = {
  months?: number;
  lastSnapshot?: LastSnapshotMeta;
};

export type StripeConnectorSyncResult = ConnectorSyncResult & {
  analyticsAvailable: boolean;
};

async function listSubscriptionsByStatus(
  credential: StripeCredential,
  status: string,
): Promise<number> {
  let count = 0;
  let startingAfter: string | undefined;

  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({ status, limit: "100" });
    if (startingAfter) params.set("starting_after", startingAfter);

    const res = await stripeConnectorRequest<StripeListResponse<StripeSubscription>>(
      credential,
      `/v1/subscriptions?${params.toString()}`,
    );

    count += res.data?.length ?? 0;
    if (!res.has_more || !res.data?.length) break;
    startingAfter = res.data[res.data.length - 1]?.id;
  }

  return count;
}

async function countFailedOpenInvoices(credential: StripeCredential): Promise<number> {
  let count = 0;
  let startingAfter: string | undefined;

  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({
      status: "open",
      limit: "100",
    });
    if (startingAfter) params.set("starting_after", startingAfter);

    const res = await stripeConnectorRequest<StripeListResponse<StripeInvoice>>(
      credential,
      `/v1/invoices?${params.toString()}`,
    );

    for (const inv of res.data ?? []) {
      if ((inv.attempt_count ?? 0) > 0) count++;
    }

    if (!res.has_more || !res.data?.length) break;
    startingAfter = res.data[res.data.length - 1]?.id;
  }

  return count;
}

/** Approximation : factures payées avec plusieurs tentatives de paiement. */
async function countRecoveredPayments(credential: StripeCredential): Promise<number> {
  let count = 0;
  let startingAfter: string | undefined;

  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({
      status: "paid",
      limit: "100",
    });
    if (startingAfter) params.set("starting_after", startingAfter);

    const res = await stripeConnectorRequest<StripeListResponse<StripeInvoice>>(
      credential,
      `/v1/invoices?${params.toString()}`,
    );

    for (const inv of res.data ?? []) {
      if ((inv.attempt_count ?? 0) > 1) count++;
    }

    if (!res.has_more || !res.data?.length) break;
    startingAfter = res.data[res.data.length - 1]?.id;
  }

  return count;
}

export async function buildPaymentStream(credential: StripeCredential): Promise<PaymentStream> {
  const [pastDue, openFailed, recovered] = await Promise.all([
    listSubscriptionsByStatus(credential, "past_due"),
    countFailedOpenInvoices(credential),
    countRecoveredPayments(credential),
  ]);

  return {
    type: "payment",
    failedPayments: pastDue + openFailed,
    recoveredPayments: recovered,
  };
}

async function buildSnapshotsFromV1Path(
  credential: StripeCredential,
  monthKeys: string[],
  lastSnapshot?: LastSnapshotMeta,
): Promise<MetricsSnapshot[]> {
  const [{ mrr, customers }, invoiceMrrByMonth, subscriptionGrowthByMonth] = await Promise.all([
    fetchCurrentMrrFromSubscriptions(credential),
    fetchInvoiceMrrByMonth(credential, monthKeys),
    fetchSubscriptionGrowthByMonth(credential, monthKeys),
  ]);

  return buildSnapshotsFromV1({
    currentMrr: mrr,
    activeCustomers: customers,
    monthKeys,
    invoiceMrrByMonth,
    subscriptionGrowthByMonth,
    lastSnapshot,
  });
}

export async function fetchStripeConnectorSync(
  credential: StripeCredential,
  options: StripeConnectorSyncOptions = {},
): Promise<StripeConnectorSyncResult> {
  const months = options.months ?? 12;
  const monthKeys = getMonthKeys(months);
  const analyticsAvailable = await probeAnalyticsAccess(credential);

  let snapshots: MetricsSnapshot[];

  if (analyticsAvailable) {
    const [mrrSeries, growth, activeCustomers] = await Promise.all([
      fetchMrrSeries(credential, months),
      fetchGrowthByChangeType(
        credential,
        ["new", "reactivation", "expansion", "churn"],
        months,
      ),
      countUniqueActiveCustomers(credential),
    ]);
    snapshots = buildSnapshotsFromAnalytics(mrrSeries, growth, monthKeys, activeCustomers);
  } else {
    snapshots = await buildSnapshotsFromV1Path(credential, monthKeys, options.lastSnapshot);
  }

  const stream = await buildPaymentStream(credential);

  return {
    snapshots,
    stream,
    syncedAt: new Date().toISOString(),
    analyticsAvailable,
  };
}

/** @deprecated Utiliser countUniqueActiveCustomers depuis v1-metrics */
export async function countActiveCustomers(credential: StripeCredential): Promise<number> {
  return countUniqueActiveCustomers(credential);
}
