import "server-only";

import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import {
  STRIPE_ANALYTICS_VERSION,
  StripeConnectorError,
  stripeConnectorRequest,
} from "@/lib/connectors/stripe/client";
import type {
  AnalyticsQueryResult,
  StripeCredential,
  StripeGrowthChangeType,
} from "@/lib/connectors/stripe/types";

function monthKeyFromTimestamp(timestamp: string): string {
  const d = new Date(timestamp);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getAnalyticsRange(months: number): { startsAt: string; endsAt: string } {
  const now = new Date();
  const starts = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  return { startsAt: starts.toISOString(), endsAt: now.toISOString() };
}

async function queryMetricWithRetry(
  credential: StripeCredential,
  body: Record<string, unknown>,
): Promise<AnalyticsQueryResult> {
  try {
    return await stripeConnectorRequest<AnalyticsQueryResult>(
      credential,
      "/v2/data/analytics/metric_query",
      { method: "POST", apiVersion: STRIPE_ANALYTICS_VERSION, body },
    );
  } catch (err) {
    const status = err instanceof StripeConnectorError ? err.status : undefined;
    if (status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      return stripeConnectorRequest<AnalyticsQueryResult>(
        credential,
        "/v2/data/analytics/metric_query",
        { method: "POST", apiVersion: STRIPE_ANALYTICS_VERSION, body },
      );
    }
    if (err instanceof StripeConnectorError && err.code === "metric_inaccessible") {
      throw new StripeConnectorError(
        "Permissions Analytics manquantes sur la clé Stripe. Activez la lecture Analytics dans les permissions de votre clé restreinte.",
        err.code,
        err.status,
      );
    }
    throw err;
  }
}

export async function fetchMrrSeries(
  credential: StripeCredential,
  months = 12,
): Promise<Map<string, number>> {
  const { startsAt, endsAt } = getAnalyticsRange(months);
  const result = await queryMetricWithRetry(credential, {
    metrics: [{ name: "revenue.mrr" }],
    starts_at: startsAt,
    ends_at: endsAt,
    granularity: "month",
    currency: credential.currency,
  });

  const map = new Map<string, number>();
  for (const row of result.data ?? []) {
    const key = monthKeyFromTimestamp(row.timestamp);
    const value = row.results?.[0]?.value ?? 0;
    map.set(key, (map.get(key) ?? 0) + value);
  }
  return map;
}

export async function fetchGrowthByChangeType(
  credential: StripeCredential,
  changeTypes: StripeGrowthChangeType[],
  months = 12,
): Promise<Map<string, Map<StripeGrowthChangeType, number>>> {
  const { startsAt, endsAt } = getAnalyticsRange(months);
  const result = await queryMetricWithRetry(credential, {
    metrics: [{ name: "revenue_growth.mrr" }],
    starts_at: startsAt,
    ends_at: endsAt,
    granularity: "month",
    currency: credential.currency,
    filters: { change_type: changeTypes },
    group_by: ["change_type"],
  });

  const map = new Map<string, Map<StripeGrowthChangeType, number>>();
  for (const row of result.data ?? []) {
    const key = monthKeyFromTimestamp(row.timestamp);
    const changeType = row.dimensions?.change_type as StripeGrowthChangeType | undefined;
    if (!changeType) continue;
    const value = row.results?.[0]?.value ?? 0;
    if (!map.has(key)) map.set(key, new Map());
    const inner = map.get(key)!;
    inner.set(changeType, (inner.get(changeType) ?? 0) + value);
  }
  return map;
}

export function getMonthKeys(months: number): string[] {
  return lastNMonths(months);
}
