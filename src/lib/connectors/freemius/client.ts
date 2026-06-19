import "server-only";

import { parseFreemiusApiToken, parseFreemiusProductId } from "@/lib/connectors/freemius/keys";
import type {
  FreemiusAccountMeta,
  FreemiusCredential,
  FreemiusListSubscriptionsResponse,
  FreemiusProductResponse,
  FreemiusProductSummary,
  FreemiusSubscriptionRecord,
} from "@/lib/connectors/freemius/types";

export { parseFreemiusCredential } from "@/lib/connectors/freemius/keys";

const API_BASE = "https://api.freemius.com/v1";
const MAX_RETRIES = 3;
const PAGE_SIZE = 50;

export class FreemiusConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FreemiusConnectorError";
    this.status = status;
  }
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
  }

  if (status === 401) {
    return "Bearer Token Freemius invalide ou expiré. Vérifiez le token dans Settings → API Token.";
  }
  if (status === 403) {
    return "Accès refusé à ce produit Freemius.";
  }
  if (status === 404) {
    return "Produit Freemius introuvable. Vérifiez l'identifiant produit.";
  }
  if (status === 429) {
    return "Limite de requêtes Freemius atteinte. Réessayez dans une minute.";
  }

  return `Erreur Freemius (${status})`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function freemiusRequest<T>(
  apiToken: string,
  path: string,
  options: {
    searchParams?: URLSearchParams;
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

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiToken}`,
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
    await sleep(1000 * (attempt + 1));
    return freemiusRequest<T>(apiToken, path, { ...options, attempt: attempt + 1 });
  }

  if (!res.ok) {
    throw new FreemiusConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function fetchProduct(
  productId: string,
  apiToken: string,
): Promise<FreemiusProductSummary> {
  const id = parseFreemiusProductId(productId);
  const token = parseFreemiusApiToken(apiToken);

  const params = new URLSearchParams({
    fields: "id,title,slug,environment",
  });

  const product = await freemiusRequest<FreemiusProductResponse>(
    token,
    `/products/${encodeURIComponent(id)}.json`,
    { searchParams: params },
  );

  return {
    id: String(product.id),
    title: product.title,
    slug: product.slug,
    sandbox: product.environment === 1,
  };
}

export async function listAllSubscriptions(
  credential: Pick<FreemiusCredential, "productId" | "apiToken">,
  filter: "all" | "active" | "cancelled" = "all",
): Promise<FreemiusSubscriptionRecord[]> {
  const results: FreemiusSubscriptionRecord[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      filter,
      count: String(PAGE_SIZE),
      offset: String(offset),
    });

    const response = await freemiusRequest<FreemiusListSubscriptionsResponse>(
      credential.apiToken,
      `/products/${encodeURIComponent(credential.productId)}/subscriptions.json`,
      { searchParams: params },
    );

    const batch = response.subscriptions ?? [];
    results.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return results;
}

export function buildAccountMeta(credential: FreemiusCredential): FreemiusAccountMeta {
  return {
    accountLabel: credential.productTitle,
    productId: credential.productId,
    currency: credential.currency,
    sandbox: credential.sandbox,
  };
}

export async function validateCredential(
  credential: FreemiusCredential,
): Promise<FreemiusAccountMeta> {
  const product = await fetchProduct(credential.productId, credential.apiToken);
  credential.productTitle = product.title;
  credential.sandbox = product.sandbox;
  return buildAccountMeta(credential);
}
