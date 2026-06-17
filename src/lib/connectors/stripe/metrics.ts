import "server-only";

import type { ConnectorSyncResult } from "@/lib/connectors/types";
import type { PaymentStream } from "@/lib/connectors/streams";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import {
  fetchGrowthByChangeType,
  fetchMrrSeries,
  getMonthKeys,
} from "@/lib/connectors/stripe/analytics";
import { stripeConnectorRequest } from "@/lib/connectors/stripe/client";
import { buildSnapshotsFromAnalytics } from "@/lib/connectors/stripe/snapshots";
import type { StripeCredential } from "@/lib/connectors/stripe/types";

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

export async function countActiveCustomers(credential: StripeCredential): Promise<number> {
  let count = 0;
  let startingAfter: string | undefined;

  for (let page = 0; page < 50; page++) {
    const params = new URLSearchParams({
      status: "active",
      limit: "100",
    });
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

export async function fetchStripeConnectorSync(
  credential: StripeCredential,
  months = 12,
): Promise<ConnectorSyncResult> {
  const monthKeys = getMonthKeys(months);

  const useFallback = process.env.STRIPE_CONNECTOR_FALLBACK === "1";

  let snapshots: MetricsSnapshot[];
  let stream: PaymentStream;

  if (useFallback) {
    const activeCustomers = await countActiveCustomers(credential);
    const mrrEuros = activeCustomers > 0 ? 0 : 0;
    void mrrEuros;
    snapshots = monthKeys.map((date) => ({
      date,
      mrr: 0,
      newMrr: 0,
      expansionMrr: 0,
      churnedMrr: 0,
      customers: date === monthKeys.at(-1) ? activeCustomers : 0,
      signups: 0,
      trials: 0,
      activeUsers: 0,
      mau: 0,
      dau: 0,
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      source: "stripe" as const,
    }));
    stream = await buildPaymentStream(credential);
  } else {
    const [mrrSeries, growth, activeCustomers] = await Promise.all([
      fetchMrrSeries(credential, months),
      fetchGrowthByChangeType(
        credential,
        ["new", "reactivation", "expansion", "churn"],
        months,
      ),
      countActiveCustomers(credential),
    ]);

    snapshots = buildSnapshotsFromAnalytics(mrrSeries, growth, monthKeys, activeCustomers);
    stream = await buildPaymentStream(credential);
  }

  return {
    snapshots,
    stream,
    syncedAt: new Date().toISOString(),
  };
}
