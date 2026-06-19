import "server-only";

import {
  buildAccessTokenExpiry,
  buildRefreshTokenExpiry,
  getLinkedInAdsApiVersion,
  refreshLinkedInAdsAccessToken,
} from "@/lib/connectors/linkedin-ads/oauth";
import {
  isAccessTokenExpired,
  shouldRefreshAccessToken,
} from "@/lib/connectors/linkedin-ads/token-lifecycle";
import {
  buildAnalyticsDateRange,
  formatRestLiDateRange,
  normalizeAdAccountId,
  toAdAccountUrn,
} from "@/lib/connectors/linkedin-ads/snapshots";
import type {
  LinkedInAdsAdAccount,
  LinkedInAdsAdAccountSummary,
  LinkedInAdsAnalyticsRow,
  LinkedInAdsCredential,
} from "@/lib/connectors/linkedin-ads/types";

const API_BASE = "https://api.linkedin.com/rest";

export class LinkedInAdsConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LinkedInAdsConnectorError";
    this.status = status;
  }
}

type LinkedInCollectionResponse<T> = {
  elements?: T[];
  paging?: {
    count?: number;
    start?: number;
    links?: unknown[];
  };
};

function parseApiError(body: unknown, status: number): LinkedInAdsConnectorError {
  const record = body as {
    message?: string;
    status?: number;
    code?: string;
    serviceErrorCode?: number;
  };
  const message = record.message ?? "Erreur LinkedIn Marketing API";
  const code = record.code ?? "";

  if (status === 401 || code === "EMPTY_ACCESS_TOKEN") {
    return new LinkedInAdsConnectorError(
      "Accès LinkedIn Ads refusé ou token expiré. Reconnectez votre compte LinkedIn.",
      status,
    );
  }

  if (status === 403 || code === "USER_NOT_AUTHORIZED") {
    return new LinkedInAdsConnectorError(
      "Accès LinkedIn Ads refusé. Vérifiez que le compte est whitelisté dans le Developer Portal (Products → View Ad Accounts) et que les scopes r_ads / r_ads_reporting sont accordés.",
      status,
    );
  }

  if (status === 414) {
    return new LinkedInAdsConnectorError(
      "Requête LinkedIn Ads trop longue. Réessayez ou contactez le support.",
      status,
    );
  }

  return new LinkedInAdsConnectorError(message, status);
}

export { isAccessTokenExpired, shouldRefreshAccessToken };

export async function ensureFreshAccessToken(
  credential: LinkedInAdsCredential,
): Promise<{ credential: LinkedInAdsCredential; refreshed: boolean }> {
  if (!shouldRefreshAccessToken(credential.accessTokenExpiresAt)) {
    return { credential, refreshed: false };
  }

  if (isAccessTokenExpired(credential.accessTokenExpiresAt)) {
    if (!credential.refreshToken?.trim()) {
      throw new LinkedInAdsConnectorError(
        "Token LinkedIn Ads expiré. Reconnectez votre compte via OAuth.",
        401,
      );
    }
  }

  const refreshed = await refreshLinkedInAdsAccessToken(credential.refreshToken);
  return {
    credential: {
      ...credential,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      accessTokenExpiresAt: buildAccessTokenExpiry(refreshed.expiresIn),
      refreshTokenExpiresAt:
        buildRefreshTokenExpiry(refreshed.refreshExpiresIn) ?? credential.refreshTokenExpiresAt,
    },
    refreshed: true,
  };
}

type LinkedInRequestOptions = {
  method?: "GET" | "POST";
  params?: Record<string, string>;
  restliFinder?: boolean;
  useQueryTunneling?: boolean;
};

async function linkedInAdsRequest<T>(
  path: string,
  accessToken: string,
  options: LinkedInRequestOptions = {},
): Promise<T> {
  const { method = "GET", params = {}, restliFinder = false, useQueryTunneling = false } = options;
  const apiVersion = getLinkedInAdsApiVersion();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "LinkedIn-Version": apiVersion,
    "X-RestLi-Protocol-Version": "2.0.0",
  };

  if (restliFinder) {
    headers["X-RestLi-Method"] = "finder";
  }

  let url = `${API_BASE}${path}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    query.set(key, value);
  }
  const queryString = query.toString();

  if (method === "GET" && queryString) {
    url = `${url}?${queryString}`;
  }

  if (useQueryTunneling && method === "GET" && queryString) {
    headers["X-HTTP-Method-Override"] = "GET";
    const res = await fetch(url.split("?")[0]!, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: queryString,
    });
    return parseLinkedInResponse<T>(res);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method === "POST" && queryString ? queryString : undefined,
  });

  return parseLinkedInResponse<T>(res);
}

async function parseLinkedInResponse<T>(res: Response): Promise<T> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new LinkedInAdsConnectorError("Réponse LinkedIn Ads invalide", res.status);
    }
    return {} as T;
  }

  if (!res.ok) {
    throw parseApiError(body, res.status);
  }

  return body as T;
}

function mapAdAccount(account: LinkedInAdsAdAccount): LinkedInAdsAdAccountSummary | null {
  const id = account.id;
  if (id === undefined || id === null) return null;

  const adAccountId = String(id);
  return {
    adAccountId,
    adAccountUrn: toAdAccountUrn(adAccountId),
    name: account.name?.trim() || `Compte ${adAccountId}`,
    currencyCode: account.currency,
    status: account.status,
  };
}

export async function listAccessibleAdAccounts(
  credential: LinkedInAdsCredential,
): Promise<LinkedInAdsAdAccountSummary[]> {
  const data = await linkedInAdsRequest<LinkedInCollectionResponse<LinkedInAdsAdAccount>>(
    "/adAccounts",
    credential.accessToken,
    {
      restliFinder: true,
      params: {
        q: "search",
        search: "(status:(values:List(ACTIVE)),test:(values:List(false)))",
      },
    },
  );

  return (data.elements ?? [])
    .map(mapAdAccount)
    .filter((item): item is LinkedInAdsAdAccountSummary => item !== null);
}

export async function fetchAdAccountSummary(
  credential: LinkedInAdsCredential,
  adAccountId: string,
): Promise<LinkedInAdsAdAccountSummary> {
  const normalizedId = normalizeAdAccountId(adAccountId);
  const data = await linkedInAdsRequest<LinkedInAdsAdAccount>(
    `/adAccounts/${encodeURIComponent(toAdAccountUrn(normalizedId))}`,
    credential.accessToken,
  );

  const mapped = mapAdAccount(data);
  if (!mapped) {
    throw new LinkedInAdsConnectorError("Compte publicitaire LinkedIn introuvable", 404);
  }

  return mapped;
}

const ANALYTICS_FIELDS =
  "costInLocalCurrency,impressions,clicks,externalWebsiteConversions,oneClickLeads,dateRange,pivotValues";

export async function fetchMonthlyAnalyticsRows(
  credential: LinkedInAdsCredential,
  adAccountId: string,
  months = 12,
): Promise<LinkedInAdsAnalyticsRow[]> {
  const normalizedId = normalizeAdAccountId(adAccountId);
  const accountUrn = encodeURIComponent(toAdAccountUrn(normalizedId));
  const dateRange = formatRestLiDateRange(buildAnalyticsDateRange(months));

  const params: Record<string, string> = {
    q: "analytics",
    pivot: "ACCOUNT",
    timeGranularity: "MONTHLY",
    accounts: `List(${accountUrn})`,
    dateRange,
    fields: ANALYTICS_FIELDS,
  };

  try {
    const data = await linkedInAdsRequest<LinkedInCollectionResponse<LinkedInAdsAnalyticsRow>>(
      "/adAnalytics",
      credential.accessToken,
      { restliFinder: true, params },
    );
    if (data.elements?.length) return data.elements;
  } catch (err) {
    if (!(err instanceof LinkedInAdsConnectorError) || err.status !== 414) {
      throw err;
    }
  }

  return fetchDailyAnalyticsRowsFallback(credential, normalizedId, months);
}

async function fetchDailyAnalyticsRowsFallback(
  credential: LinkedInAdsCredential,
  adAccountId: string,
  months: number,
): Promise<LinkedInAdsAnalyticsRow[]> {
  const accountUrn = encodeURIComponent(toAdAccountUrn(adAccountId));
  const dateRange = formatRestLiDateRange(buildAnalyticsDateRange(months));

  const params: Record<string, string> = {
    q: "analytics",
    pivot: "ACCOUNT",
    timeGranularity: "DAILY",
    accounts: `List(${accountUrn})`,
    dateRange,
    fields: ANALYTICS_FIELDS,
  };

  const data = await linkedInAdsRequest<LinkedInCollectionResponse<LinkedInAdsAnalyticsRow>>(
    "/adAnalytics",
    credential.accessToken,
    {
      restliFinder: true,
      params,
      useQueryTunneling: true,
    },
  );

  return data.elements ?? [];
}

export async function validateLinkedInAdsCredential(
  credential: LinkedInAdsCredential,
): Promise<LinkedInAdsAdAccountSummary> {
  if (!credential.adAccountId?.trim()) {
    throw new LinkedInAdsConnectorError("Compte publicitaire LinkedIn non sélectionné", 400);
  }

  const account = await fetchAdAccountSummary(credential, credential.adAccountId);
  if (account.status && account.status !== "ACTIVE") {
    throw new LinkedInAdsConnectorError(
      "Ce compte publicitaire LinkedIn est inactif ou désactivé.",
      400,
    );
  }

  return account;
}
