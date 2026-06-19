import "server-only";

import {
  buildAccessTokenExpiry,
  buildRefreshTokenExpiry,
  refreshTikTokAdsAccessToken,
  TIKTOK_ADS_API_VERSION,
} from "@/lib/connectors/tiktok-ads/oauth";
import {
  isAccessTokenExpired,
  shouldRefreshAccessToken,
} from "@/lib/connectors/tiktok-ads/token-lifecycle";
import {
  buildReportDateRange,
  normalizeAdvertiserId,
} from "@/lib/connectors/tiktok-ads/snapshots";
import type {
  TikTokAdsAdvertiser,
  TikTokAdsAdvertiserSummary,
  TikTokAdsCredential,
  TikTokAdsReportRow,
} from "@/lib/connectors/tiktok-ads/types";

const API_BASE = `https://business-api.tiktok.com/open_api/${TIKTOK_ADS_API_VERSION}`;

const RETRYABLE_CODES = new Set([40100, 40101, 50000, 50001]);

export class TikTokAdsConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "TikTokAdsConnectorError";
    this.status = status;
  }
}

type TikTokApiBody<T> = {
  code?: number;
  message?: string;
  data?: T;
};

type TikTokReportListData = {
  list?: TikTokAdsReportRow[];
  page_info?: {
    page?: number;
    page_size?: number;
    total_page?: number;
    total_number?: number;
  };
};

type TikTokAdvertiserListData = {
  list?: TikTokAdsAdvertiser[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseApiError(body: unknown, status: number): TikTokAdsConnectorError {
  const record = body as TikTokApiBody<unknown>;
  const message = record.message ?? "Erreur TikTok Marketing API";
  const code = record.code;

  if (status === 401 || status === 403 || code === 40105) {
    return new TikTokAdsConnectorError(
      "Accès TikTok Ads refusé ou token expiré. Reconnectez votre compte TikTok.",
      status,
    );
  }

  if (code === 40002 || /permission|scope/i.test(message)) {
    return new TikTokAdsConnectorError(
      "Permission ad.read manquante. Vérifiez l'autorisation OAuth et l'app review TikTok.",
      status,
    );
  }

  if (code === 40001 && /app review|sandbox/i.test(message)) {
    return new TikTokAdsConnectorError(
      "Application TikTok en attente de validation (app review). Consultez la console TikTok for Business.",
      status,
    );
  }

  return new TikTokAdsConnectorError(message, status);
}

export { isAccessTokenExpired, shouldRefreshAccessToken };

export async function ensureFreshAccessToken(
  credential: TikTokAdsCredential,
): Promise<{ credential: TikTokAdsCredential; refreshed: boolean }> {
  if (!shouldRefreshAccessToken(credential.accessTokenExpiresAt)) {
    return { credential, refreshed: false };
  }

  if (isAccessTokenExpired(credential.accessTokenExpiresAt)) {
    if (!credential.refreshToken?.trim()) {
      throw new TikTokAdsConnectorError(
        "Token TikTok Ads expiré. Reconnectez votre compte via OAuth.",
        401,
      );
    }
  }

  const refreshed = await refreshTikTokAdsAccessToken(credential.refreshToken);
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

async function fetchTikTokJson<T>(
  url: string,
  accessToken: string,
  attempt = 0,
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Access-Token": accessToken,
      Accept: "application/json",
    },
  });

  let body: TikTokApiBody<T>;
  try {
    body = (await res.json()) as TikTokApiBody<T>;
  } catch {
    throw new TikTokAdsConnectorError("Réponse TikTok Ads invalide", res.status);
  }

  if (!res.ok || body.code !== 0) {
    const code = body.code;
    if (code && RETRYABLE_CODES.has(code) && attempt < 3) {
      await sleep(1000 * 2 ** attempt);
      return fetchTikTokJson<T>(url, accessToken, attempt + 1);
    }
    throw parseApiError(body, res.status);
  }

  return body.data as T;
}

function buildApiUrl(path: string, params: Record<string, string>): string {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function mapAdvertiser(advertiser: TikTokAdsAdvertiser): TikTokAdsAdvertiserSummary | null {
  const advertiserId = normalizeAdvertiserId(advertiser.advertiser_id ?? "");
  if (!advertiserId) return null;

  return {
    advertiserId,
    name: advertiser.advertiser_name?.trim() || `Compte ${advertiserId}`,
    currencyCode: advertiser.currency,
    status: advertiser.status,
  };
}

export async function listAccessibleAdvertisers(
  credential: TikTokAdsCredential,
): Promise<TikTokAdsAdvertiserSummary[]> {
  const data = await fetchTikTokJson<TikTokAdvertiserListData>(
    buildApiUrl("/oauth2/advertiser/get/", {}),
    credential.accessToken,
  );

  const advertisers = (data.list ?? [])
    .map(mapAdvertiser)
    .filter((item): item is TikTokAdsAdvertiserSummary => item !== null);

  return advertisers;
}

export async function fetchAdvertiserSummary(
  credential: TikTokAdsCredential,
  advertiserId: string,
): Promise<TikTokAdsAdvertiserSummary> {
  const normalizedId = normalizeAdvertiserId(advertiserId);
  const url = buildApiUrl("/advertiser/info/", {
    advertiser_ids: JSON.stringify([normalizedId]),
  });

  const data = await fetchTikTokJson<TikTokAdvertiserListData>(url, credential.accessToken);
  const advertiser = data.list?.[0];
  if (!advertiser) {
    throw new TikTokAdsConnectorError("Compte publicitaire TikTok introuvable", 404);
  }

  const mapped = mapAdvertiser(advertiser);
  if (!mapped) {
    throw new TikTokAdsConnectorError("Identifiant compte publicitaire TikTok invalide", 400);
  }

  return mapped;
}

export async function fetchMonthlyReportRows(
  credential: TikTokAdsCredential,
  advertiserId: string,
  months = 12,
): Promise<TikTokAdsReportRow[]> {
  const normalizedId = normalizeAdvertiserId(advertiserId);
  const { startDate, endDate } = buildReportDateRange(months);
  const rows: TikTokAdsReportRow[] = [];
  let page = 1;
  let totalPage = 1;

  while (page <= totalPage) {
    const url = buildApiUrl("/report/integrated/get/", {
      report_type: "BASIC",
      advertiser_id: normalizedId,
      data_level: "AUCTION_ADVERTISER",
      dimensions: JSON.stringify(["stat_time_month"]),
      metrics: JSON.stringify(["spend", "impressions", "clicks", "conversion"]),
      start_date: startDate,
      end_date: endDate,
      page: String(page),
      page_size: "100",
    });

    const data = await fetchTikTokJson<TikTokReportListData>(url, credential.accessToken);
    if (data.list?.length) rows.push(...data.list);

    totalPage = data.page_info?.total_page ?? 1;
    page += 1;
  }

  if (rows.length === 0) {
    return fetchDailyReportRowsFallback(credential, normalizedId, startDate, endDate);
  }

  return rows;
}

async function fetchDailyReportRowsFallback(
  credential: TikTokAdsCredential,
  advertiserId: string,
  startDate: string,
  endDate: string,
): Promise<TikTokAdsReportRow[]> {
  const rows: TikTokAdsReportRow[] = [];
  let page = 1;
  let totalPage = 1;

  while (page <= totalPage) {
    const url = buildApiUrl("/report/integrated/get/", {
      report_type: "BASIC",
      advertiser_id: advertiserId,
      data_level: "AUCTION_ADVERTISER",
      dimensions: JSON.stringify(["stat_time_day"]),
      metrics: JSON.stringify(["spend", "impressions", "clicks", "conversion"]),
      start_date: startDate,
      end_date: endDate,
      page: String(page),
      page_size: "100",
    });

    const data = await fetchTikTokJson<TikTokReportListData>(url, credential.accessToken);
    if (data.list?.length) rows.push(...data.list);

    totalPage = data.page_info?.total_page ?? 1;
    page += 1;
  }

  return rows;
}

export async function validateTikTokAdsCredential(
  credential: TikTokAdsCredential,
): Promise<TikTokAdsAdvertiserSummary> {
  if (!credential.advertiserId?.trim()) {
    throw new TikTokAdsConnectorError("Compte publicitaire TikTok non sélectionné", 400);
  }

  const account = await fetchAdvertiserSummary(credential, credential.advertiserId);
  if (account.status && account.status !== "STATUS_ENABLE") {
    throw new TikTokAdsConnectorError(
      "Ce compte publicitaire TikTok est inactif ou désactivé.",
      400,
    );
  }

  return account;
}
