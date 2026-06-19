import "server-only";

import { resolveVercelRedirectUri } from "@/lib/connectors/vercel/redirect-uri";

const VERCEL_API = "https://api.vercel.com";

function readRedirectEnv() {
  return {
    VERCEL_REDIRECT_URI: process.env.VERCEL_REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

export function getVercelRedirectUri(): string | null {
  return resolveVercelRedirectUri(readRedirectEnv());
}

export function isVercelConfigured(): boolean {
  return Boolean(
    process.env.VERCEL_CLIENT_ID?.trim() &&
      process.env.VERCEL_CLIENT_SECRET?.trim() &&
      getVercelRedirectUri(),
  );
}

export function getVercelAuthorizeUrl(state: string): string {
  const clientId = process.env.VERCEL_CLIENT_ID?.trim();
  const redirectUri = getVercelRedirectUri();
  if (!clientId || !redirectUri) {
    throw new Error("OAuth Vercel non configuré");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user project deployment team billing",
    state,
  });
  return `https://vercel.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeVercelCode(code: string): Promise<{
  accessToken: string;
  teamId?: string;
  userId?: string;
}> {
  const clientId = process.env.VERCEL_CLIENT_ID?.trim();
  const clientSecret = process.env.VERCEL_CLIENT_SECRET?.trim();
  const redirectUri = getVercelRedirectUri();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("OAuth Vercel non configuré");
  }

  const res = await fetch(`${VERCEL_API}/v2/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel OAuth error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    team_id?: string;
    user_id?: string;
  };

  return {
    accessToken: data.access_token,
    teamId: data.team_id,
    userId: data.user_id,
  };
}
