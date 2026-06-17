const DEFAULT_AUTHORIZE_BASE = "https://marketplace.stripe.com/oauth/v2/authorize";

/** Rafraîchir 5 min avant expiration (tokens Stripe Apps = 1 h). */
export const TOKEN_REFRESH_LEAD_MS = 5 * 60 * 1000;
export const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

export type StripeOAuthEnv = {
  clientId?: string;
  authorizeBaseUrl?: string;
  redirectUri?: string;
  siteUrl?: string;
};

export function readStripeOAuthEnv(
  env: Record<string, string | undefined> = process.env,
): StripeOAuthEnv {
  return {
    clientId: env.STRIPE_APP_CLIENT_ID?.trim(),
    authorizeBaseUrl: env.STRIPE_APP_OAUTH_AUTHORIZE_URL?.trim(),
    redirectUri: env.STRIPE_APP_REDIRECT_URI?.trim(),
    siteUrl: env.NEXT_PUBLIC_SITE_URL?.trim(),
  };
}

export function isStripeOAuthConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(readStripeOAuthEnv(env).clientId);
}

export function getStripeOAuthRedirectUri(
  env: Record<string, string | undefined> = process.env,
): string {
  const { redirectUri, siteUrl } = readStripeOAuthEnv(env);
  if (redirectUri) return redirectUri;
  const base = siteUrl || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/connectors/stripe/callback`;
}

export function getStripeAppAuthUrl(
  state: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const { clientId, authorizeBaseUrl } = readStripeOAuthEnv(env);
  if (!clientId) {
    throw new Error("STRIPE_APP_CLIENT_ID non configuré");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getStripeOAuthRedirectUri(env),
    state,
  });

  const base = authorizeBaseUrl || DEFAULT_AUTHORIZE_BASE;
  return `${base}?${params.toString()}`;
}

export type StripeOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  stripe_user_id?: string;
  account_id?: string;
  scope: string;
  livemode: boolean;
};

export function normalizeStripeAccountId(token: StripeOAuthTokenResponse): string {
  const accountId = token.stripe_user_id ?? token.account_id;
  if (!accountId) {
    throw new Error("Réponse OAuth Stripe sans identifiant de compte");
  }
  return accountId;
}

export function computeTokenExpiresAt(fromMs = Date.now()): string {
  return new Date(fromMs + TOKEN_LIFETIME_MS).toISOString();
}

export function oauthTokenToCredential(
  token: StripeOAuthTokenResponse,
  currency = "eur",
): import("@/lib/connectors/stripe/types").StripeOAuthCredential {
  return {
    mode: "oauth",
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    stripeAccountId: normalizeStripeAccountId(token),
    livemode: token.livemode,
    currency,
    tokenExpiresAt: computeTokenExpiresAt(),
  };
}

export function isOAuthCredentialExpired(
  credential: import("@/lib/connectors/stripe/types").StripeOAuthCredential,
): boolean {
  if (!credential.tokenExpiresAt) return true;
  const expiresAt = new Date(credential.tokenExpiresAt).getTime();
  return Date.now() >= expiresAt - TOKEN_REFRESH_LEAD_MS;
}
