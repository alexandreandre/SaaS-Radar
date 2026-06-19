import "server-only";

const GOOGLE_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function isGoogleAnalyticsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_ANALYTICS_CLIENT_ID?.trim() &&
    process.env.GOOGLE_ANALYTICS_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_ANALYTICS_REDIRECT_URI?.trim()
  );
}

export function getGoogleAnalyticsAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_ANALYTICS_CLIENT_ID"),
    redirect_uri: requireEnv("GOOGLE_ANALYTICS_REDIRECT_URI"),
    response_type: "code",
    scope: GOOGLE_ANALYTICS_SCOPE,
    access_type: "offline",
    prompt: "consent",
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

  const data = (await res.json()) as TokenResponse;
  if (!res.ok || data.error) {
    throw new Error(
      data.error_description ?? data.error ?? "Échange de token Google Analytics échoué",
    );
  }
  return data;
}

export async function exchangeGoogleAnalyticsCode(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    code,
    client_id: requireEnv("GOOGLE_ANALYTICS_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_ANALYTICS_CLIENT_SECRET"),
    redirect_uri: requireEnv("GOOGLE_ANALYTICS_REDIRECT_URI"),
    grant_type: "authorization_code",
  });

  const data = await postTokenRequest(body);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshGoogleAnalyticsAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: requireEnv("GOOGLE_ANALYTICS_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_ANALYTICS_CLIENT_SECRET"),
    grant_type: "refresh_token",
  });

  const data = await postTokenRequest(body);
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export function buildAccessTokenExpiry(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
