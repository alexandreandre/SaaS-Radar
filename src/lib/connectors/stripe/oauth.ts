import "server-only";

const STRIPE_CONNECT_BASE = "https://connect.stripe.com";

export function isStripeConnectConfigured(): boolean {
  return Boolean(process.env.STRIPE_CONNECT_CLIENT_ID?.trim());
}

export function getStripeConnectAuthUrl(state: string): string {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("STRIPE_CONNECT_CLIENT_ID non configuré");
  }

  const redirectUri = getStripeConnectRedirectUri();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_only",
    state,
    redirect_uri: redirectUri,
  });

  return `${STRIPE_CONNECT_BASE}/oauth/authorize?${params.toString()}`;
}

export function getStripeConnectRedirectUri(): string {
  const explicit = process.env.STRIPE_CONNECT_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return `${siteUrl.replace(/\/$/, "")}/api/connectors/stripe/callback`;
}

export type StripeOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  stripe_user_id: string;
  scope: string;
  livemode: boolean;
};

export async function exchangeStripeConnectCode(code: string): Promise<StripeOAuthTokenResponse> {
  const clientSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!clientSecret) {
    throw new Error("STRIPE_SECRET_KEY requis pour l'échange OAuth Connect");
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("STRIPE_CONNECT_CLIENT_ID requis pour l'échange OAuth Connect");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_secret: clientSecret,
    client_id: clientId,
  });

  const res = await fetch(`${STRIPE_CONNECT_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
    throw new Error(err ?? `Échec OAuth Stripe (${res.status})`);
  }

  return parsed as unknown as StripeOAuthTokenResponse;
}

export function oauthTokenToCredential(
  token: StripeOAuthTokenResponse,
  currency = "eur",
): import("@/lib/connectors/stripe/types").StripeOAuthCredential {
  return {
    mode: "oauth",
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    stripeAccountId: token.stripe_user_id,
    livemode: token.livemode,
    currency,
  };
}
