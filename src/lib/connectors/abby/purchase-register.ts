import "server-only";

import { abbyConnectorRequest } from "@/lib/connectors/abby/client";
import type {
  AbbyCredential,
  AbbyPurchaseRegisterListResponse,
  AbbyPurchaseRegisterStatistics,
} from "@/lib/connectors/abby/types";

const PAGE_LIMIT = 100;
const MAX_PAGES = 50;

export async function fetchPurchaseRegisterPage(
  credential: AbbyCredential,
  page: number,
  periodStart: string,
  periodEnd: string,
): Promise<AbbyPurchaseRegisterListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_LIMIT),
    range: JSON.stringify([periodStart, periodEnd]),
  });

  const response = await abbyConnectorRequest<AbbyPurchaseRegisterListResponse>(
    credential,
    "/v3/purchaseRegister/list",
    { searchParams: params },
  );

  return (
    response ?? {
      docs: [],
      page,
      totalPages: 0,
      hasNextPage: false,
    }
  );
}

export async function fetchAllPurchaseRegisterItems(
  credential: AbbyCredential,
  periodStart: string,
  periodEnd: string,
) {
  const items = [];
  let page = 1;

  for (let i = 0; i < MAX_PAGES; i++) {
    const response = await fetchPurchaseRegisterPage(
      credential,
      page,
      periodStart,
      periodEnd,
    );
    items.push(...(response.docs ?? []));

    if (!response.hasNextPage) break;
    const nextPage = response.nextPage ?? page + 1;
    if (nextPage <= page) break;
    page = nextPage;
  }

  return items;
}

export async function fetchPurchaseRegisterStatistics(
  credential: AbbyCredential,
  periodStart: string,
  periodEnd: string,
): Promise<AbbyPurchaseRegisterStatistics | null> {
  const params = new URLSearchParams({
    rangeFrom: periodStart,
    rangeTo: periodEnd,
  });

  return abbyConnectorRequest<AbbyPurchaseRegisterStatistics>(
    credential,
    "/v3/purchaseRegister/statistics",
    { searchParams: params, allowNotFound: true },
  );
}
