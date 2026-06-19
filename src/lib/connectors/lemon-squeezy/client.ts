import "server-only";

import type {
  LemonSqueezyAccountMeta,
  LemonSqueezyCredential,
  LemonSqueezyListResponse,
  LemonSqueezyPriceAttributes,
  LemonSqueezySingleResponse,
  LemonSqueezyStoreAttributes,
  LemonSqueezyStoreSummary,
  LemonSqueezySubscriptionAttributes,
  LemonSqueezySubscriptionRecord,
} from "@/lib/connectors/lemon-squeezy/types";

export { parseLemonSqueezyCredential } from "@/lib/connectors/lemon-squeezy/keys";

const API_BASE = "https://api.lemonsqueezy.com/v1";
const MAX_RETRIES = 3;
const PAGE_SIZE = 100;

export class LemonSqueezyConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LemonSqueezyConnectorError";
    this.status = status;
  }
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const errors = record.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as Record<string, unknown>;
      if (typeof first.detail === "string" && first.detail.trim()) {
        return first.detail;
      }
      if (typeof first.title === "string" && first.title.trim()) {
        return first.title;
      }
    }
  }

  if (status === 401) {
    return "Clé API Lemon Squeezy invalide ou expirée. Créez-en une dans Settings → API.";
  }
  if (status === 403) {
    return "Accès refusé à cette ressource Lemon Squeezy.";
  }
  if (status === 404) {
    return "Boutique Lemon Squeezy introuvable. Vérifiez l'identifiant sélectionné.";
  }
  if (status === 429) {
    return "Limite de requêtes Lemon Squeezy atteinte. Réessayez dans une minute.";
  }

  return `Erreur Lemon Squeezy (${status})`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function lemonSqueezyRequest<T>(
  apiKey: string,
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    searchParams?: URLSearchParams;
    body?: unknown;
    attempt?: number;
  } = {},
): Promise<T> {
  const attempt = options.attempt ?? 0;
  const url = new URL(`${API_BASE}${path}`);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.api+json",
    Authorization: `Bearer ${apiKey}`,
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/vnd.api+json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body,
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
    await sleep(1000 * (attempt + 1));
    return lemonSqueezyRequest<T>(apiKey, path, { ...options, attempt: attempt + 1 });
  }

  if (!res.ok) {
    throw new LemonSqueezyConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function listAllPages<T>(
  apiKey: string,
  path: string,
  searchParams?: URLSearchParams,
): Promise<Array<{ id: string; attributes: T }>> {
  const results: Array<{ id: string; attributes: T }> = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams(searchParams);
    params.set("page[number]", String(page));
    params.set("page[size]", String(PAGE_SIZE));

    const response = await lemonSqueezyRequest<LemonSqueezyListResponse<T>>(apiKey, path, {
      searchParams: params,
    });

    for (const item of response.data ?? []) {
      results.push({ id: item.id, attributes: item.attributes });
    }

    const meta = response.meta?.page;
    if (!meta || page >= meta.lastPage) break;
    page += 1;
  }

  return results;
}

export async function fetchStores(apiKey: string): Promise<LemonSqueezyStoreSummary[]> {
  const stores = await listAllPages<LemonSqueezyStoreAttributes>(apiKey, "/stores");
  return stores.map((store) => ({
    id: store.id,
    name: store.attributes.name,
    currency: store.attributes.currency,
    testMode: Boolean(store.attributes.test_mode),
  }));
}

export async function fetchStore(
  credential: Pick<LemonSqueezyCredential, "apiKey" | "storeId">,
): Promise<LemonSqueezyStoreSummary> {
  const response = await lemonSqueezyRequest<LemonSqueezySingleResponse<LemonSqueezyStoreAttributes>>(
    credential.apiKey,
    `/stores/${encodeURIComponent(credential.storeId)}`,
  );

  return {
    id: response.data.id,
    name: response.data.attributes.name,
    currency: response.data.attributes.currency,
    testMode: Boolean(response.data.attributes.test_mode),
  };
}

export async function listStoreSubscriptions(
  credential: Pick<LemonSqueezyCredential, "apiKey" | "storeId">,
): Promise<LemonSqueezySubscriptionRecord[]> {
  const params = new URLSearchParams({
    "filter[store_id]": credential.storeId,
  });

  const rows = await listAllPages<LemonSqueezySubscriptionAttributes>(
    credential.apiKey,
    "/subscriptions",
    params,
  );

  return rows.map((row) => ({ id: row.id, attributes: row.attributes }));
}

export async function fetchPrice(
  apiKey: string,
  priceId: string,
): Promise<LemonSqueezyPriceAttributes> {
  const response = await lemonSqueezyRequest<LemonSqueezySingleResponse<LemonSqueezyPriceAttributes>>(
    apiKey,
    `/prices/${encodeURIComponent(priceId)}`,
  );
  return response.data.attributes;
}

export function buildAccountMeta(credential: LemonSqueezyCredential): LemonSqueezyAccountMeta {
  return {
    accountLabel: credential.storeName,
    storeId: credential.storeId,
    currency: credential.currency,
    testMode: credential.testMode,
  };
}

export async function validateCredential(
  credential: LemonSqueezyCredential,
): Promise<LemonSqueezyAccountMeta> {
  const store = await fetchStore(credential);
  credential.storeName = store.name;
  credential.currency = store.currency;
  credential.testMode = store.testMode;
  return buildAccountMeta(credential);
}
