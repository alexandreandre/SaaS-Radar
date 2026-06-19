import "server-only";

import {
  buildTokenExpiry,
  resolveZendeskApiBase,
} from "@/lib/connectors/zendesk/snapshots";
import type { ZendeskTokenResponse } from "@/lib/connectors/zendesk/types";

const OAUTH_SCOPE = "read";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function isZendeskConfigured(): boolean {
  return !!(
    process.env.ZENDESK_CLIENT_ID?.trim() &&
    process.env.ZENDESK_CLIENT_SECRET?.trim() &&
    process.env.ZENDESK_REDIRECT_URI?.trim()
  );
}

export function getZendeskAuthorizeUrl(subdomain: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: requireEnv("ZENDESK_CLIENT_ID"),
    redirect_uri: requireEnv("ZENDESK_REDIRECT_URI"),
    scope: OAUTH_SCOPE,
    state,
  });

  return `${resolveZendeskApiBase(subdomain).replace("/api/v2", "")}/oauth/authorizations/new?${params.toString()}`;
}

async function postTokenRequest(
  subdomain: string,
  body: Record<string, string>,
): Promise<ZendeskTokenResponse> {
  const url = `${resolveZendeskApiBase(subdomain).replace("/api/v2", "")}/oauth/tokens`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as ZendeskTokenResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? data.error ?? "Échange de token Zendesk échoué");
  }
  return data;
}

export async function exchangeZendeskCode(
  subdomain: string,
  code: string,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshTokenExpiresIn?: number;
}> {
  const data = await postTokenRequest(subdomain, {
    grant_type: "authorization_code",
    code,
    client_id: requireEnv("ZENDESK_CLIENT_ID"),
    client_secret: requireEnv("ZENDESK_CLIENT_SECRET"),
    redirect_uri: requireEnv("ZENDESK_REDIRECT_URI"),
    scope: OAUTH_SCOPE,
  });

  if (!data.access_token) {
    throw new Error("Token d'accès Zendesk manquant dans la réponse OAuth");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
}

export async function refreshZendeskToken(
  subdomain: string,
  refreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshTokenExpiresIn?: number;
}> {
  const data = await postTokenRequest(subdomain, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: requireEnv("ZENDESK_CLIENT_ID"),
    client_secret: requireEnv("ZENDESK_CLIENT_SECRET"),
  });

  if (!data.access_token) {
    throw new Error("Refresh token Zendesk invalide — reconnectez Zendesk depuis le marketplace");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
}

export function buildCredentialFromTokens(
  subdomain: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    refreshTokenExpiresIn?: number;
    accountName?: string;
  },
): import("@/lib/connectors/zendesk/types").ZendeskCredential {
  return {
    subdomain,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresIn ? buildTokenExpiry(tokens.expiresIn) : undefined,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresIn
      ? buildTokenExpiry(tokens.refreshTokenExpiresIn)
      : undefined,
    accountName: tokens.accountName,
  };
}
