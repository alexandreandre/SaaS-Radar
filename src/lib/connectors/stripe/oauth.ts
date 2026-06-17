import "server-only";

import {
  type StripeOAuthTokenResponse,
} from "@/lib/connectors/stripe/oauth-config";

export {
  computeTokenExpiresAt,
  getStripeAppAuthUrl,
  getStripeOAuthRedirectUri,
  isStripeOAuthConfigured,
  normalizeStripeAccountId,
  oauthTokenToCredential,
  TOKEN_LIFETIME_MS,
  TOKEN_REFRESH_LEAD_MS,
  type StripeOAuthTokenResponse,
} from "@/lib/connectors/stripe/oauth-config";

const STRIPE_API_TOKEN_URL = "https://api.stripe.com/v1/oauth/token";

function getPlatformSecretKey(): string {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY requis pour OAuth Stripe Apps");
  }
  return secret;
}

async function postOAuthToken(body: URLSearchParams): Promise<StripeOAuthTokenResponse> {
  const secret = getPlatformSecretKey();
  const auth = Buffer.from(`${secret}:`).toString("base64");

  const res = await fetch(STRIPE_API_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  }

  if (!res.ok) {
    const err = parsed.error_description as string | undefined;
    throw new Error(err ?? `Échec OAuth Stripe Apps (${res.status})`);
  }

  return parsed as unknown as StripeOAuthTokenResponse;
}

export async function exchangeStripeAppCode(code: string): Promise<StripeOAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
  });
  return postOAuthToken(body);
}

export async function refreshStripeAppToken(refreshToken: string): Promise<StripeOAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return postOAuthToken(body);
}
