import "server-only";

import type { IntercomTokenResponse } from "@/lib/connectors/intercom/types";

const OAUTH_AUTHORIZE_URL = "https://app.intercom.com/oauth";
const OAUTH_TOKEN_URL = "https://api.intercom.io/auth/eagle/token";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function isIntercomConfigured(): boolean {
  return !!(
    process.env.INTERCOM_CLIENT_ID?.trim() &&
    process.env.INTERCOM_CLIENT_SECRET?.trim() &&
    process.env.INTERCOM_REDIRECT_URI?.trim()
  );
}

export function getIntercomAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("INTERCOM_CLIENT_ID"),
    state,
  });

  const redirectUri = process.env.INTERCOM_REDIRECT_URI?.trim();
  if (redirectUri) {
    params.set("redirect_uri", redirectUri);
  }

  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeIntercomCode(code: string): Promise<{ accessToken: string }> {
  const body = new URLSearchParams({
    code,
    client_id: requireEnv("INTERCOM_CLIENT_ID"),
    client_secret: requireEnv("INTERCOM_CLIENT_SECRET"),
  });

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as IntercomTokenResponse;
  const accessToken = data.access_token ?? data.token;

  if (!res.ok || !accessToken) {
    const message =
      data.errors?.[0]?.message ??
      data.error ??
      "Échange de token Intercom échoué";
    throw new Error(message);
  }

  return { accessToken };
}
