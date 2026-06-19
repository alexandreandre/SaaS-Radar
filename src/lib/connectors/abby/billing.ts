import "server-only";

import { abbyConnectorRequest } from "@/lib/connectors/abby/client";
import type {
  AbbyBillingCollectionResponse,
  AbbyBillingStatistics,
  AbbyCredential,
  AbbyRevenueSource,
} from "@/lib/connectors/abby/types";
import {
  aggregateBillingDocuments,
  buildAccountingStreamFromBillingStatistics,
} from "@/lib/connectors/abby/stream";

const PAGE_LIMIT = 100;
const MAX_PAGES = 50;

const BILLING_LIST_PATHS = ["/v2/billings", "/v2/billing/list", "/v2/billing/documents"] as const;

async function fetchBillingListPage(
  credential: AbbyCredential,
  path: (typeof BILLING_LIST_PATHS)[number],
  page: number,
  periodStart: string,
  periodEnd: string,
): Promise<AbbyBillingCollectionResponse | null> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_LIMIT),
    rangeFrom: periodStart,
    rangeTo: periodEnd,
    rangeType: "paidAt",
    type: "invoice",
  });

  return abbyConnectorRequest<AbbyBillingCollectionResponse>(credential, path, {
    searchParams: params,
    allowNotFound: true,
  });
}

async function fetchAllBillingDocuments(
  credential: AbbyCredential,
  periodStart: string,
  periodEnd: string,
): Promise<{ docs: AbbyBillingCollectionResponse["docs"]; source: AbbyRevenueSource } | null> {
  for (const path of BILLING_LIST_PATHS) {
    const docs = [];
    let page = 1;

    for (let i = 0; i < MAX_PAGES; i++) {
      const response = await fetchBillingListPage(
        credential,
        path,
        page,
        periodStart,
        periodEnd,
      );
      if (!response) break;

      docs.push(...(response.docs ?? []));

      if (!response.hasNextPage) {
        if (docs.length > 0) {
          return { docs, source: "billing_list" };
        }
        break;
      }

      const nextPage = response.nextPage ?? page + 1;
      if (nextPage <= page) {
        return { docs, source: "billing_list" };
      }
      page = nextPage;
    }

    if (docs.length > 0) {
      return { docs, source: "billing_list" };
    }
  }

  return null;
}

export async function fetchBillingStatistics(
  credential: AbbyCredential,
  periodStart: string,
  periodEnd: string,
): Promise<AbbyBillingStatistics | null> {
  const params = new URLSearchParams({
    rangeFrom: periodStart,
    rangeTo: periodEnd,
    rangeType: "paidAt",
    type: "invoice",
  });

  return abbyConnectorRequest<AbbyBillingStatistics>(
    credential,
    "/v2/billing/statistics",
    { searchParams: params, allowNotFound: true },
  );
}

export async function fetchRevenueTotals(
  credential: AbbyCredential,
  periodStart: string,
  periodEnd: string,
): Promise<{
  revenueBooked: number;
  vatCollected: number;
  revenueSource: AbbyRevenueSource;
}> {
  const listResult = await fetchAllBillingDocuments(credential, periodStart, periodEnd);
  if (listResult && listResult.docs.length > 0) {
    const totals = aggregateBillingDocuments(listResult.docs, periodStart, periodEnd);
    return {
      ...totals,
      revenueSource: listResult.source,
    };
  }

  const statistics = await fetchBillingStatistics(credential, periodStart, periodEnd);
  if (statistics) {
    const totals = buildAccountingStreamFromBillingStatistics(statistics);
    return {
      ...totals,
      revenueSource: "billing_statistics",
    };
  }

  return {
    revenueBooked: 0,
    vatCollected: 0,
    revenueSource: "unavailable",
  };
}
