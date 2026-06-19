import "server-only";

const OAUTH_AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const OAUTH_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_ADS_SCOPE = "r_ads r_ads_reporting";

export const LINKEDIN_ADS_DEFAULT_API_VERSION = "202605";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function getLinkedInAdsApiVersion(): string {
  return process.env.LINKEDIN_ADS_API_VERSION?.trim() || LINKEDIN_ADS_DEFAULT_API_VERSION;
}

export function isLinkedInAdsConfigured(): boolean {
  return !!(
    process.env.LINKEDIN_ADS_CLIENT_ID?.trim() &&
    process.env.LINKEDIN_ADS_CLIENT_SECRET?.trim() &&
    process.env.LINKEDIN_ADS_REDIRECT_URI?.trim()
  );
}

export function getLinkedInAdsAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: requireEnv("LINKEDIN_ADS_CLIENT_ID"),
    redirect_uri: requireEnv("LINKEDIN_ADS_REDIRECT_URI"),
    scope: LINKEDIN_ADS_SCOPE,
    state,
  });
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function postTokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  let data: TokenResponse;
  try {
    data = (await res.json()) as TokenResponse;
  } catch {
    throw new Error("Réponse LinkedIn Ads invalide lors de l'échange de token");
  }

  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? data.error ?? "Échange de token LinkedIn Ads échoué");
  }

  if (!data.access_token) {
    throw new Error("Token LinkedIn Ads manquant dans la réponse");
  }

  return data;
}

export async function exchangeLinkedInAdsCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn?: number;
}> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: requireEnv("LINKEDIN_ADS_CLIENT_ID"),
    client_secret: requireEnv("LINKEDIN_ADS_CLIENT_SECRET"),
    redirect_uri: requireEnv("LINKEDIN_ADS_REDIRECT_URI"),
  });

  const data = await postTokenRequest(params);

  if (!data.access_token) {
    throw new Error("Access token LinkedIn Ads manquant après échange OAuth.");
  }

  if (!data.refresh_token) {
    throw new Error(
      "Refresh token LinkedIn Ads manquant. Vérifiez que l'app a accès à l'Advertising API.",
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 5_184_000,
    refreshExpiresIn: data.refresh_token_expires_in,
  };
}

export async function refreshLinkedInAdsAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn?: number;
}> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: requireEnv("LINKEDIN_ADS_CLIENT_ID"),
    client_secret: requireEnv("LINKEDIN_ADS_CLIENT_SECRET"),
  });

  const data = await postTokenRequest(params);

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in ?? 5_184_000,
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
