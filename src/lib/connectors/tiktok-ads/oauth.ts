import "server-only";

export const TIKTOK_ADS_API_VERSION = "v1.3";
const API_BASE = `https://business-api.tiktok.com/open_api/${TIKTOK_ADS_API_VERSION}`;
const OAUTH_AUTHORIZE_URL = "https://business-api.tiktok.com/portal/auth";

type TikTokTokenData = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  advertiser_ids?: string[];
};

type TikTokApiResponse = {
  code?: number;
  message?: string;
  data?: TikTokTokenData;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function isTikTokAdsConfigured(): boolean {
  return !!(
    process.env.TIKTOK_ADS_APP_ID?.trim() &&
    process.env.TIKTOK_ADS_APP_SECRET?.trim() &&
    process.env.TIKTOK_ADS_REDIRECT_URI?.trim()
  );
}

export function getTikTokAdsAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    app_id: requireEnv("TIKTOK_ADS_APP_ID"),
    redirect_uri: requireEnv("TIKTOK_ADS_REDIRECT_URI"),
    state,
  });
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

function parseTokenResponse(body: TikTokApiResponse): TikTokTokenData {
  if (body.code !== 0 || !body.data?.access_token) {
    throw new Error(body.message ?? "Échange de token TikTok Ads échoué");
  }
  return body.data;
}

async function postTokenEndpoint(
  path: string,
  payload: Record<string, string>,
): Promise<TikTokTokenData> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body: TikTokApiResponse;
  try {
    body = (await res.json()) as TikTokApiResponse;
  } catch {
    throw new Error("Réponse TikTok Ads invalide lors de l'échange de token");
  }

  if (!res.ok) {
    throw new Error(body.message ?? "Échange de token TikTok Ads échoué");
  }

  return parseTokenResponse(body);
}

export async function exchangeTikTokAdsCode(authCode: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn?: number;
  advertiserIds: string[];
}> {
  const data = await postTokenEndpoint("/oauth2/access_token/", {
    app_id: requireEnv("TIKTOK_ADS_APP_ID"),
    secret: requireEnv("TIKTOK_ADS_APP_SECRET"),
    auth_code: authCode,
  });

  if (!data.refresh_token) {
    throw new Error("Refresh token TikTok Ads manquant dans la réponse");
  }

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 86_400,
    refreshExpiresIn: data.refresh_token_expires_in,
    advertiserIds: data.advertiser_ids ?? [],
  };
}

export async function refreshTikTokAdsAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn?: number;
}> {
  const data = await postTokenEndpoint("/oauth2/refresh_token/", {
    app_id: requireEnv("TIKTOK_ADS_APP_ID"),
    secret: requireEnv("TIKTOK_ADS_APP_SECRET"),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  if (!data.refresh_token) {
    throw new Error("Refresh token TikTok Ads manquant après renouvellement");
  }

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 86_400,
    refreshExpiresIn: data.refresh_token_expires_in,
  };
}

export function buildAccessTokenExpiry(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

export function buildRefreshTokenExpiry(expiresIn: number | undefined): string | undefined {
  if (!expiresIn || !Number.isFinite(expiresIn)) return undefined;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
