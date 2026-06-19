import "server-only";

import { buildAccountLabel } from "@/lib/connectors/paddle/keys";
import type {
  PaddleAccountMeta,
  PaddleCredential,
  PaddleListResponse,
  PaddleMetricsResponse,
  PaddlePermissionProbe,
  PaddleSubscriptionAttributes,
  PaddleSubscriptionRecord,
  PaddleTransactionAttributes,
  PaddleTransactionRecord,
} from "@/lib/connectors/paddle/types";

export { parsePaddleApiKey, parsePaddleCredential } from "@/lib/connectors/paddle/keys";

const LIVE_BASE = "https://api.paddle.com";
const SANDBOX_BASE = "https://sandbox-api.paddle.com";
const MAX_RETRIES = 3;
const PAGE_SIZE = 200;

export class PaddleConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PaddleConnectorError";
    this.status = status;
  }
}

function getBaseUrl(credential: Pick<PaddleCredential, "apiKey" | "sandbox">): string {
  return credential.sandbox ? SANDBOX_BASE : LIVE_BASE;
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const error = record.error;
    if (error && typeof error === "object") {
      const errObj = error as Record<string, unknown>;
      if (typeof errObj.detail === "string" && errObj.detail.trim()) {
        return errObj.detail;
      }
    }
  }

  if (status === 401) {
    return "Clé API Paddle invalide ou expirée. Créez-en une dans Developer tools → Authentication.";
  }
  if (status === 403) {
    return "Permissions insuffisantes. Ajoutez metrics.read, subscription.read et transaction.read à votre clé API Paddle.";
  }
  if (status === 429) {
    return "Limite de requêtes Paddle atteinte. Réessayez dans une minute.";
  }

  return `Erreur Paddle (${status})`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function paddleRequest<T>(
  credential: Pick<PaddleCredential, "apiKey" | "sandbox">,
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    searchParams?: URLSearchParams;
    attempt?: number;
  } = {},
): Promise<T> {
  const attempt = options.attempt ?? 0;
  const url = new URL(`${getBaseUrl(credential)}${path}`);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${credential.apiKey}`,
      "Paddle-Version": "1",
    },
  });

  const text = await res.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (res.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = Number.parseInt(res.headers.get("Retry-After") ?? "1", 10);
    await sleep(Math.max(1000, retryAfter * 1000) * (attempt + 1));
    return paddleRequest<T>(credential, path, { ...options, attempt: attempt + 1 });
  }

  if (!res.ok) {
    throw new PaddleConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

async function listAllPages<T extends Record<string, unknown>>(
  credential: PaddleCredential,
  path: string,
  searchParams?: URLSearchParams,
): Promise<Array<{ id: string } & T>> {
  const results: Array<{ id: string } & T> = [];
  let after: string | undefined;

  while (true) {
    const params = new URLSearchParams(searchParams);
    params.set("per_page", String(PAGE_SIZE));
    if (after) params.set("after", after);

    const response = await paddleRequest<PaddleListResponse<T>>(credential, path, {
      searchParams: params,
    });

    for (const item of response.data ?? []) {
      results.push(item);
    }

    const pagination = response.meta?.pagination;
    if (!pagination?.has_more || !pagination.next) break;

    const nextUrl = new URL(pagination.next);
    after = nextUrl.searchParams.get("after") ?? undefined;
    if (!after) break;
  }

  return results;
}

export async function fetchEventTypes(
  credential: Pick<PaddleCredential, "apiKey" | "sandbox">,
): Promise<unknown> {
  return paddleRequest(credential, "/event-types");
}

export async function fetchMrrMetrics(
  credential: PaddleCredential,
  from: string,
  to: string,
): Promise<PaddleMetricsResponse> {
  const params = new URLSearchParams({ from, to });
  return paddleRequest<PaddleMetricsResponse>(credential, "/metrics/monthly-recurring-revenue", {
    searchParams: params,
  });
}

export async function fetchActiveSubscribersMetrics(
  credential: PaddleCredential,
  from: string,
  to: string,
): Promise<PaddleMetricsResponse> {
  const params = new URLSearchParams({ from, to });
  return paddleRequest<PaddleMetricsResponse>(credential, "/metrics/active-subscribers", {
    searchParams: params,
  });
}

export async function listSubscriptions(
  credential: PaddleCredential,
): Promise<PaddleSubscriptionRecord[]> {
  const rows = await listAllPages<PaddleSubscriptionAttributes>(credential, "/subscriptions");
  return rows.map(({ id, ...attributes }) => ({ id, attributes }));
}

export async function countPastDueSubscriptions(credential: PaddleCredential): Promise<number> {
  const params = new URLSearchParams({ status: "past_due" });
  const rows = await listAllPages<PaddleSubscriptionAttributes>(credential, "/subscriptions", params);
  return rows.length;
}

export async function countPastDueTransactions(credential: PaddleCredential): Promise<number> {
  const params = new URLSearchParams({ status: "past_due" });
  const rows = await listAllPages<PaddleTransactionAttributes>(credential, "/transactions", params);
  return rows.length;
}

export async function listRecentCompletedTransactions(
  credential: PaddleCredential,
  sinceIso: string,
): Promise<PaddleTransactionRecord[]> {
  const params = new URLSearchParams({ status: "completed" });
  const rows = await listAllPages<PaddleTransactionAttributes>(credential, "/transactions", params);
  return rows
    .filter((row) => row.updated_at >= sinceIso)
    .map(({ id, ...attributes }) => ({ id, attributes }));
}

export async function probePermissions(
  credential: PaddleCredential,
): Promise<PaddlePermissionProbe> {
  const probe: PaddlePermissionProbe = {
    metricsAvailable: false,
    subscriptionsAvailable: false,
    transactionsAvailable: false,
  };

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  try {
    await fetchMrrMetrics(credential, weekAgo, today);
    probe.metricsAvailable = true;
  } catch (err) {
    if (!(err instanceof PaddleConnectorError && err.status === 403)) throw err;
  }

  try {
    const params = new URLSearchParams({ per_page: "1" });
    await paddleRequest<PaddleListResponse<PaddleSubscriptionAttributes>>(
      credential,
      "/subscriptions",
      { searchParams: params },
    );
    probe.subscriptionsAvailable = true;
  } catch (err) {
    if (!(err instanceof PaddleConnectorError && err.status === 403)) throw err;
  }

  try {
    const params = new URLSearchParams({ per_page: "1" });
    await paddleRequest<PaddleListResponse<PaddleTransactionAttributes>>(
      credential,
      "/transactions",
      { searchParams: params },
    );
    probe.transactionsAvailable = true;
  } catch (err) {
    if (!(err instanceof PaddleConnectorError && err.status === 403)) throw err;
  }

  if (!probe.metricsAvailable && !probe.subscriptionsAvailable) {
    throw new PaddleConnectorError(
      "Permissions insuffisantes. Ajoutez au minimum metrics.read ou subscription.read à votre clé API Paddle.",
      403,
    );
  }

  return probe;
}

export async function validateCredential(
  credential: PaddleCredential,
): Promise<PaddleAccountMeta> {
  await fetchEventTypes(credential);
  const probe = await probePermissions(credential);

  let currency = credential.currency;
  if (probe.metricsAvailable) {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    try {
      const mrr = await fetchMrrMetrics(credential, weekAgo, today);
      if (mrr.data.currency_code) {
        currency = mrr.data.currency_code;
        credential.currency = currency;
      }
    } catch {
      // Keep default currency
    }
  }

  return {
    accountLabel: buildAccountLabel(credential, currency),
    sandbox: credential.sandbox,
    currency,
    metricsAvailable: probe.metricsAvailable,
  };
}
