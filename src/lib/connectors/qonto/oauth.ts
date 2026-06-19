import "server-only";

import type { QontoTokenResponse } from "@/lib/connectors/qonto/types";

const DEFAULT_AUTHORIZE_URL = "https://oauth.qonto.com/oauth2/auth";
const DEFAULT_TOKEN_URL = "https://oauth.qonto.com/oauth2/token";
const QONTO_OAUTH_SCOPES = "offline_access organization.read";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function getQontoOAuthAuthorizeUrl(): string {
  return process.env.QONTO_OAUTH_AUTHORIZE_URL?.trim() || DEFAULT_AUTHORIZE_URL;
}

export function getQontoOAuthTokenUrl(): string {
  return process.env.QONTO_OAUTH_TOKEN_URL?.trim() || DEFAULT_TOKEN_URL;
}

export function isQontoConfigured(): boolean {
  return !!(
    process.env.QONTO_CLIENT_ID?.trim() &&
    process.env.QONTO_CLIENT_SECRET?.trim() &&
    process.env.QONTO_REDIRECT_URI?.trim()
  );
}

export function getQontoAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("QONTO_CLIENT_ID"),
    redirect_uri: requireEnv("QONTO_REDIRECT_URI"),
    response_type: "code",
    scope: QONTO_OAUTH_SCOPES,
    state,
  });
  return `${getQontoOAuthAuthorizeUrl()}?${params.toString()}`;
}

async function postTokenRequest(body: URLSearchParams): Promise<QontoTokenResponse> {
  const res = await fetch(getQontoOAuthTokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as QontoTokenResponse;
  if (!res.ok || data.error) {
    throw new Error(
      data.error_description ?? data.error ?? "Échange de token Qonto échoué",
    );
  }
  return data;
}

export function buildAccessTokenExpiry(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

export async function exchangeQontoCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: requireEnv("QONTO_CLIENT_ID"),
    client_secret: requireEnv("QONTO_CLIENT_SECRET"),
    redirect_uri: requireEnv("QONTO_REDIRECT_URI"),
  });

  const data = await postTokenRequest(body);
  if (!data.access_token || !data.refresh_token) {
    throw new Error(
      "Tokens Qonto incomplets — vérifiez que le scope offline_access est activé sur votre app OAuth",
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
  };
}

export async function refreshQontoAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: requireEnv("QONTO_CLIENT_ID"),
    client_secret: requireEnv("QONTO_CLIENT_SECRET"),
  });

  const data = await postTokenRequest(body);
  if (!data.access_token || !data.refresh_token) {
    throw new Error(
      "Refresh token Qonto invalide — reconnectez Qonto depuis le marketplace Intégrations",
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
  };
}
