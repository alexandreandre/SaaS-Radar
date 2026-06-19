import "server-only";

import type { PennylaneTokenResponse } from "@/lib/connectors/pennylane/types";

const OAUTH_AUTHORIZE_URL = "https://app.pennylane.com/oauth/authorize";
const OAUTH_TOKEN_URL = "https://app.pennylane.com/oauth/token";
const OAUTH_REVOKE_URL = "https://app.pennylane.com/oauth/revoke";

export const PENNYLANE_OAUTH_SCOPES = [
  "trial_balance:readonly",
  "customer_invoices:readonly",
  "supplier_invoices:readonly",
].join(" ");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function isPennylaneOAuthConfigured(): boolean {
  return !!(
    process.env.PENNYLANE_CLIENT_ID?.trim() &&
    process.env.PENNYLANE_CLIENT_SECRET?.trim() &&
    process.env.PENNYLANE_REDIRECT_URI?.trim()
  );
}

export function getPennylaneAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("PENNYLANE_CLIENT_ID"),
    redirect_uri: requireEnv("PENNYLANE_REDIRECT_URI"),
    response_type: "code",
    scope: PENNYLANE_OAUTH_SCOPES,
    state,
  });
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function postTokenRequest(body: URLSearchParams): Promise<PennylaneTokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as PennylaneTokenResponse;
  if (!res.ok || data.error || !data.access_token) {
    throw new Error(
      data.error_description ?? data.error ?? "Échange de token Pennylane échoué",
    );
  }
  return data;
}

export async function exchangePennylaneCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    client_id: requireEnv("PENNYLANE_CLIENT_ID"),
    client_secret: requireEnv("PENNYLANE_CLIENT_SECRET"),
    code,
    redirect_uri: requireEnv("PENNYLANE_REDIRECT_URI"),
    grant_type: "authorization_code",
  });

  const data = await postTokenRequest(body);
  if (!data.refresh_token) {
    throw new Error("Refresh token Pennylane manquant — réautorisez l'accès OAuth");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 86400,
  };
}

export async function refreshPennylaneAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    client_id: requireEnv("PENNYLANE_CLIENT_ID"),
    client_secret: requireEnv("PENNYLANE_CLIENT_SECRET"),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const data = await postTokenRequest(body);
  if (!data.refresh_token) {
    throw new Error("Refresh token Pennylane manquant après rotation — réautorisez OAuth");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 86400,
  };
}

export function buildAccessTokenExpiry(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

export async function revokePennylaneToken(token: string): Promise<void> {
  if (!isPennylaneOAuthConfigured()) return;

  const body = new URLSearchParams({
    client_id: requireEnv("PENNYLANE_CLIENT_ID"),
    client_secret: requireEnv("PENNYLANE_CLIENT_SECRET"),
    token,
  });

  await fetch(OAUTH_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }).catch(() => {
    // Best-effort revoke
  });
}
