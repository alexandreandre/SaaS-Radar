import "server-only";

import { META_ADS_API_VERSION } from "@/lib/connectors/meta-ads/snapshots";

const META_ADS_SCOPE = "ads_read";
const OAUTH_AUTHORIZE_URL = `https://www.facebook.com/${META_ADS_API_VERSION}/dialog/oauth`;
const OAUTH_TOKEN_URL = `https://graph.facebook.com/${META_ADS_API_VERSION}/oauth/access_token`;

type TokenResponse = {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  error?: { message?: string; type?: string; code?: number };
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function isMetaAdsConfigured(): boolean {
  return !!(
    process.env.META_ADS_CLIENT_ID?.trim() &&
    process.env.META_ADS_CLIENT_SECRET?.trim() &&
    process.env.META_ADS_REDIRECT_URI?.trim()
  );
}

export function getMetaAdsAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("META_ADS_CLIENT_ID"),
    redirect_uri: requireEnv("META_ADS_REDIRECT_URI"),
    response_type: "code",
    scope: META_ADS_SCOPE,
    state,
  });
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function fetchToken(params: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch(`${OAUTH_TOKEN_URL}?${params.toString()}`);
  const data = (await res.json()) as TokenResponse;

  if (!res.ok || data.error) {
    throw new Error(
      data.error?.message ?? "Échange de token Meta Ads échoué",
    );
  }

  if (!data.access_token) {
    throw new Error("Token Meta Ads manquant dans la réponse");
  }

  return data;
}

export async function exchangeMetaAdsCode(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    client_id: requireEnv("META_ADS_CLIENT_ID"),
    client_secret: requireEnv("META_ADS_CLIENT_SECRET"),
    redirect_uri: requireEnv("META_ADS_REDIRECT_URI"),
    code,
  });

  const data = await fetchToken(params);
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 3600,
  };
}

export async function exchangeLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: requireEnv("META_ADS_CLIENT_ID"),
    client_secret: requireEnv("META_ADS_CLIENT_SECRET"),
    fb_exchange_token: shortLivedToken,
  });

  const data = await fetchToken(params);
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 5_184_000,
  };
}

export function buildAccessTokenExpiry(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
