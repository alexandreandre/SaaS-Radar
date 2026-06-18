import "server-only";

import {
  buildAccessTokenExpiry,
  exchangeLongLivedToken,
} from "@/lib/connectors/meta-ads/oauth";
import {
  isAccessTokenExpired,
  shouldRefreshAccessToken,
} from "@/lib/connectors/meta-ads/token-lifecycle";
import {
  buildInsightsTimeRange,
  META_ADS_API_VERSION,
  normalizeAdAccountId,
} from "@/lib/connectors/meta-ads/snapshots";
import type {
  MetaAdsAccountSummary,
  MetaAdsAdAccount,
  MetaAdsCredential,
  MetaAdsGraphList,
  MetaAdsInsightRow,
} from "@/lib/connectors/meta-ads/types";

const GRAPH_API_BASE = `https://graph.facebook.com/${META_ADS_API_VERSION}`;

const RETRYABLE_ERROR_CODES = new Set([17, 80000]);

export class MetaAdsConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "MetaAdsConnectorError";
    this.status = status;
  }
}

type GraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

function parseGraphError(body: unknown, status: number): MetaAdsConnectorError {
  const record = body as GraphErrorBody;
  const error = record.error;
  const message = error?.message ?? "Erreur Meta Marketing API";
  const code = error?.code;

  if (status === 401 || status === 403 || code === 190) {
    return new MetaAdsConnectorError(
      "Accès Meta Ads refusé ou token expiré. Reconnectez votre compte Meta.",
      status,
    );
  }

  if (code === 10 || code === 200) {
    return new MetaAdsConnectorError(
      "Permission ads_read manquante. Vérifiez l'autorisation OAuth et l'App Review Meta.",
      status,
    );
  }

  if (code === 100 && /report|async|job/i.test(message)) {
    return new MetaAdsConnectorError(
      "Volume de données trop important — réessayez ou contactez le support.",
      status,
    );
  }

  return new MetaAdsConnectorError(message, status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { isAccessTokenExpired, shouldRefreshAccessToken };

export async function ensureFreshAccessToken(
  credential: MetaAdsCredential,
): Promise<{ credential: MetaAdsCredential; refreshed: boolean }> {
  if (!shouldRefreshAccessToken(credential.accessTokenExpiresAt)) {
    return { credential, refreshed: false };
  }

  if (isAccessTokenExpired(credential.accessTokenExpiresAt)) {
    throw new MetaAdsConnectorError(
      "Token Meta Ads expiré. Reconnectez votre compte via OAuth.",
      401,
    );
  }

  const refreshed = await exchangeLongLivedToken(credential.accessToken);
  return {
    credential: {
      ...credential,
      accessToken: refreshed.accessToken,
      accessTokenExpiresAt: buildAccessTokenExpiry(refreshed.expiresIn),
    },
    refreshed: true,
  };
}

async function fetchGraphJson<T>(
  url: string,
  attempt = 0,
): Promise<{ ok: true; data: T } | { ok: false; body: unknown; status: number }> {
  const res = await fetch(url);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const graphError = body as GraphErrorBody;
    const code = graphError.error?.code;
    if (code && RETRYABLE_ERROR_CODES.has(code) && attempt < 3) {
      await sleep(1000 * 2 ** attempt);
      return fetchGraphJson<T>(url, attempt + 1);
    }
    return { ok: false, body, status: res.status };
  }

  return { ok: true, data: body as T };
}

async function metaGraphRequest<T>(
  credential: MetaAdsCredential,
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set("access_token", credential.accessToken);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const result = await fetchGraphJson<T>(url.toString());
  if (!result.ok) {
    throw parseGraphError(result.body, result.status);
  }
  return result.data;
}

async function fetchAllPagesFromUrl<T>(
  credential: MetaAdsCredential,
  path: string,
  params: Record<string, string>,
): Promise<T[]> {
  const items: T[] = [];
  const firstUrl = new URL(`${GRAPH_API_BASE}${path}`);
  firstUrl.searchParams.set("access_token", credential.accessToken);
  for (const [key, value] of Object.entries(params)) {
    firstUrl.searchParams.set(key, value);
  }

  let url: string | null = firstUrl.toString();

  while (url) {
    const result: Awaited<ReturnType<typeof fetchGraphJson<MetaAdsGraphList<T>>>> =
      await fetchGraphJson<MetaAdsGraphList<T>>(url);
    if (!result.ok) {
      throw parseGraphError(result.body, result.status);
    }

    if (result.data.data?.length) items.push(...result.data.data);
    url = result.data.paging?.next ?? null;
  }

  return items;
}

function mapAdAccount(account: MetaAdsAdAccount): MetaAdsAccountSummary {
  const adAccountId = normalizeAdAccountId(account.id || account.account_id || "");
  return {
    adAccountId,
    name: account.name?.trim() || `Compte ${adAccountId}`,
    currencyCode: account.currency,
    accountStatus: account.account_status,
  };
}

export async function listAccessibleAdAccounts(
  credential: MetaAdsCredential,
  limit = 50,
): Promise<MetaAdsAccountSummary[]> {
  const accounts = await fetchAllPagesFromUrl<MetaAdsAdAccount>(
    credential,
    "/me/adaccounts",
    {
      fields: "id,name,account_id,currency,account_status",
      limit: String(Math.min(limit, 50)),
    },
  );

  return accounts.slice(0, limit).map(mapAdAccount);
}

export async function fetchAdAccountSummary(
  credential: MetaAdsCredential,
  adAccountId: string,
): Promise<MetaAdsAccountSummary> {
  const normalizedId = normalizeAdAccountId(adAccountId);
  const account = await metaGraphRequest<MetaAdsAdAccount>(
    credential,
    `/${normalizedId}`,
    { fields: "id,name,account_id,currency,account_status" },
  );

  return mapAdAccount(account);
}

export async function fetchMonthlyInsights(
  credential: MetaAdsCredential,
  adAccountId: string,
  months = 12,
): Promise<MetaAdsInsightRow[]> {
  const normalizedId = normalizeAdAccountId(adAccountId);
  const timeRange = buildInsightsTimeRange(months);

  return fetchAllPagesFromUrl<MetaAdsInsightRow>(
    credential,
    `/${normalizedId}/insights`,
    {
      fields: "spend,impressions,clicks,actions,date_start,date_stop",
      level: "account",
      time_increment: "monthly",
      time_range: JSON.stringify(timeRange),
      limit: "100",
    },
  );
}

export async function validateMetaAdsCredential(
  credential: MetaAdsCredential,
): Promise<MetaAdsAccountSummary> {
  if (!credential.adAccountId?.trim()) {
    throw new MetaAdsConnectorError("Compte publicitaire Meta non sélectionné", 400);
  }

  const account = await fetchAdAccountSummary(credential, credential.adAccountId);
  if (account.accountStatus !== undefined && account.accountStatus !== 1) {
    throw new MetaAdsConnectorError(
      "Ce compte publicitaire Meta est inactif ou désactivé.",
      400,
    );
  }

  return account;
}
