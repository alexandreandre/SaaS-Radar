import "server-only";

import {
  buildTokenExpiry,
  normalizeApiDomain,
} from "@/lib/connectors/pipedrive/snapshots";
import type { PipedriveTokenResponse } from "@/lib/connectors/pipedrive/types";

const OAUTH_AUTHORIZE_URL = "https://oauth.pipedrive.com/oauth/authorize";
const OAUTH_TOKEN_URL = "https://oauth.pipedrive.com/oauth/token";
const OAUTH_SCOPE = "deals:read";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

function basicAuthHeader(): string {
  const clientId = requireEnv("PIPEDRIVE_CLIENT_ID");
  const clientSecret = requireEnv("PIPEDRIVE_CLIENT_SECRET");
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export function isPipedriveConfigured(): boolean {
  return !!(
    process.env.PIPEDRIVE_CLIENT_ID?.trim() &&
    process.env.PIPEDRIVE_CLIENT_SECRET?.trim() &&
    process.env.PIPEDRIVE_REDIRECT_URI?.trim()
  );
}

export function getPipedriveAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("PIPEDRIVE_CLIENT_ID"),
    redirect_uri: requireEnv("PIPEDRIVE_REDIRECT_URI"),
    state,
    scope: OAUTH_SCOPE,
  });

  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function postTokenRequest(body: Record<string, string>): Promise<PipedriveTokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  const data = (await res.json()) as PipedriveTokenResponse;
  if (!res.ok || data.error || !data.access_token) {
    throw new Error(
      data.error_description ?? data.error ?? "Échange de token Pipedrive échoué",
    );
  }

  return data;
}

export async function exchangePipedriveCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  apiDomain: string;
  tokenExpiresAt?: string;
  scope?: string;
}> {
  const data = await postTokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: requireEnv("PIPEDRIVE_REDIRECT_URI"),
  });

  if (!data.refresh_token) {
    throw new Error("Refresh token Pipedrive manquant dans la réponse OAuth");
  }

  const apiDomain = normalizeApiDomain(data.api_domain ?? "");
  if (!apiDomain) {
    throw new Error("Domaine API Pipedrive manquant dans la réponse OAuth");
  }

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token,
    apiDomain,
    tokenExpiresAt: buildTokenExpiry(data.expires_in),
    scope: data.scope,
  };
}

export async function refreshPipedriveToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  apiDomain?: string;
  tokenExpiresAt?: string;
  scope?: string;
}> {
  const data = await postTokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  if (!data.refresh_token) {
    throw new Error("Refresh token Pipedrive invalide — reconnectez Pipedrive depuis le marketplace");
  }

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token,
    apiDomain: data.api_domain ? normalizeApiDomain(data.api_domain) : undefined,
    tokenExpiresAt: buildTokenExpiry(data.expires_in),
    scope: data.scope,
  };
}
