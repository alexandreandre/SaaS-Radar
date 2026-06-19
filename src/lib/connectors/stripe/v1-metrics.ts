import "server-only";

import type { MonthlyGrowth } from "@/lib/connectors/stripe/errors";
import { centsToEuros } from "@/lib/connectors/stripe/keys";
import {
  monthKeyFromUnix,
  normalizePriceToMonthlyMrrCents,
  type StripeRecurringPrice,
} from "@/lib/connectors/stripe/mrr-math";
import { stripeConnectorRequest } from "@/lib/connectors/stripe/client";
import type { StripeCredential } from "@/lib/connectors/stripe/types";

type StripeListResponse<T> = {
  data: T[];
  has_more: boolean;
};

export type StripeSubscriptionItem = {
  quantity?: number;
  price?: StripeRecurringPrice;
};

export type StripeSubscriptionV1 = {
  id: string;
  customer: string;
  status: string;
  created: number;
  canceled_at?: number | null;
  items: { data: StripeSubscriptionItem[] };
};

type StripeInvoiceLine = {
  amount: number;
  type?: string;
  period?: { start: number; end: number };
  price?: StripeRecurringPrice | null;
};

type StripeInvoiceV1 = {
  id: string;
  status: string | null;
  created: number;
  period_start?: number;
  lines?: { data: StripeInvoiceLine[] };
};

export type CurrentMrrResult = {
  mrr: number;
  customers: number;
  mrrCents: number;
};

async function paginateStripeList<T>(
  credential: StripeCredential,
  basePath: string,
  params: URLSearchParams,
  maxPages = 50,
): Promise<T[]> {
  const items: T[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const query = new URLSearchParams(params);
    if (startingAfter) query.set("starting_after", startingAfter);

    const res = await stripeConnectorRequest<StripeListResponse<T>>(
      credential,
      `${basePath}?${query.toString()}`,
    );

    items.push(...(res.data ?? []));
    if (!res.has_more || !res.data?.length) break;
    startingAfter = (res.data[res.data.length - 1] as { id?: string })?.id;
    if (!startingAfter) break;
  }

  return items;
}

export function computeSubscriptionMrrCents(
  subscription: StripeSubscriptionV1,
  targetCurrency: string,
): number {
  const currency = targetCurrency.toLowerCase();
  let total = 0;

  for (const item of subscription.items?.data ?? []) {
    const price = item.price;
    if (!price || price.currency.toLowerCase() !== currency) continue;
    total += normalizePriceToMonthlyMrrCents(price, item.quantity ?? 1);
  }

  return total;
}

export async function fetchActiveSubscriptions(
  credential: StripeCredential,
): Promise<StripeSubscriptionV1[]> {
  const params = new URLSearchParams({
    status: "active",
    limit: "100",
  });
  params.append("expand[]", "data.items.data.price");

  return paginateStripeList<StripeSubscriptionV1>(
    credential,
    "/v1/subscriptions",
    params,
  );
}

export async function fetchCurrentMrrFromSubscriptions(
  credential: StripeCredential,
): Promise<CurrentMrrResult> {
  const subscriptions = await fetchActiveSubscriptions(credential);
  let mrrCents = 0;
  const customers = new Set<string>();

  for (const sub of subscriptions) {
    mrrCents += computeSubscriptionMrrCents(sub, credential.currency);
    if (typeof sub.customer === "string") customers.add(sub.customer);
  }

  return {
    mrrCents,
    mrr: centsToEuros(mrrCents),
    customers: customers.size,
  };
}

function monthStartUnix(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, 1) / 1000);
}

export async function fetchInvoiceMrrByMonth(
  credential: StripeCredential,
  monthKeys: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const key of monthKeys) map.set(key, 0);

  if (monthKeys.length === 0) return map;

  const createdGte = monthStartUnix(monthKeys[0]!);
  const params = new URLSearchParams({
    status: "paid",
    limit: "100",
    "created[gte]": String(createdGte),
  });
  params.append("expand[]", "data.lines.data.price");

  const invoices = await paginateStripeList<StripeInvoiceV1>(
    credential,
    "/v1/invoices",
    params,
    30,
  );

  const currency = credential.currency.toLowerCase();

  for (const invoice of invoices) {
    const periodStart = invoice.period_start ?? invoice.created;
    const monthKey = monthKeyFromUnix(periodStart);
    if (!map.has(monthKey)) continue;

    for (const line of invoice.lines?.data ?? []) {
      if (line.type && line.type !== "subscription") continue;
      const price = line.price;
      if (price?.recurring && price.currency.toLowerCase() === currency) {
        const lineMrr = normalizePriceToMonthlyMrrCents(price, 1);
        map.set(monthKey, (map.get(monthKey) ?? 0) + centsToEuros(lineMrr));
        continue;
      }
      if (line.amount > 0 && price?.recurring) {
        map.set(monthKey, (map.get(monthKey) ?? 0) + centsToEuros(line.amount));
      }
    }
  }

  return map;
}

export async function fetchSubscriptionGrowthByMonth(
  credential: StripeCredential,
  monthKeys: string[],
): Promise<Map<string, MonthlyGrowth>> {
  const map = new Map<string, MonthlyGrowth>();
  for (const key of monthKeys) {
    map.set(key, { newMrr: 0, expansionMrr: 0, churnedMrr: 0 });
  }

  if (monthKeys.length === 0) return map;

  const createdGte = monthStartUnix(monthKeys[0]!);
  const params = new URLSearchParams({
    status: "all",
    limit: "100",
    "created[gte]": String(createdGte),
  });
  params.append("expand[]", "data.items.data.price");

  const subscriptions = await paginateStripeList<StripeSubscriptionV1>(
    credential,
    "/v1/subscriptions",
    params,
    30,
  );

  for (const sub of subscriptions) {
    const mrr = centsToEuros(computeSubscriptionMrrCents(sub, credential.currency));
    if (mrr <= 0) continue;

    const createdKey = monthKeyFromUnix(sub.created);
    if (map.has(createdKey)) {
      const g = map.get(createdKey)!;
      g.newMrr = Math.round((g.newMrr + mrr) * 100) / 100;
    }

    if (sub.canceled_at) {
      const canceledKey = monthKeyFromUnix(sub.canceled_at);
      if (map.has(canceledKey)) {
        const g = map.get(canceledKey)!;
        g.churnedMrr = Math.round((g.churnedMrr + mrr) * 100) / 100;
      }
    }
  }

  return map;
}

export async function countUniqueActiveCustomers(
  credential: StripeCredential,
): Promise<number> {
  const { customers } = await fetchCurrentMrrFromSubscriptions(credential);
  return customers;
}
