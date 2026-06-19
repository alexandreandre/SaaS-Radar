import "server-only";

import type { HubSpotTokenResponse } from "@/lib/connectors/hubspot/types";

const HUBSPOT_SCOPES = "oauth crm.objects.deals.read";
const OAUTH_AUTHORIZE_URL = "https://app.hubspot.com/oauth/authorize";
const OAUTH_TOKEN_URL = "https://api.hubapi.com/oauth/v3/token";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function getHubSpotRedirectUri(): string | null {
  const explicit = process.env.HUBSPOT_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return null;

  return `${appUrl.replace(/\/$/, "")}/api/connectors/hubspot/callback`;
}

export function isHubSpotConfigured(): boolean {
  return !!(
    process.env.HUBSPOT_CLIENT_ID?.trim() &&
    process.env.HUBSPOT_CLIENT_SECRET?.trim() &&
    getHubSpotRedirectUri()
  );
}

export function getHubSpotAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("HUBSPOT_CLIENT_ID"),
    redirect_uri: getHubSpotRedirectUri() ?? requireEnv("HUBSPOT_REDIRECT_URI"),
    scope: HUBSPOT_SCOPES,
    state,
  });

  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function postTokenRequest(body: URLSearchParams): Promise<HubSpotTokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as HubSpotTokenResponse;
  if (!res.ok || data.error || data.status === "error") {
    throw new Error(data.message ?? data.error ?? "Échange de token HubSpot échoué");
  }

  return data;
}

export async function exchangeHubSpotCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: requireEnv("HUBSPOT_CLIENT_ID"),
    client_secret: requireEnv("HUBSPOT_CLIENT_SECRET"),
    redirect_uri: getHubSpotRedirectUri() ?? requireEnv("HUBSPOT_REDIRECT_URI"),
    code,
  });

  const data = await postTokenRequest(body);
  if (!data.access_token || !data.refresh_token) {
    throw new Error("Tokens HubSpot manquants dans la réponse OAuth");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 1800,
  };
}

export async function refreshHubSpotAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: requireEnv("HUBSPOT_CLIENT_ID"),
    client_secret: requireEnv("HUBSPOT_CLIENT_SECRET"),
    redirect_uri: getHubSpotRedirectUri() ?? requireEnv("HUBSPOT_REDIRECT_URI"),
    refresh_token: refreshToken,
  });

  const data = await postTokenRequest(body);
  if (!data.access_token) {
    throw new Error("Token d'accès HubSpot manquant après refresh");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 1800,
  };
}

export function buildAccessTokenExpiry(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
