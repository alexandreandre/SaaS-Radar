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

export type ParsedStripeOAuthInstallLink = {
  authorizeBase: string;
  clientId: string;
};

/** Retire guillemets et espaces parasites (copier-coller depuis le dashboard). */
export function sanitizeStripeEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }
  return trimmed;
}

/** Parse le lien Test OAuth complet copié depuis Apps → External test / Settings. */
export function parseStripeOAuthInstallLink(
  installLink: string,
): ParsedStripeOAuthInstallLink | null {
  try {
    const url = new URL(installLink.trim());
    const clientId = url.searchParams.get("client_id")?.trim();
    if (!clientId) return null;

    url.searchParams.delete("client_id");
    url.searchParams.delete("redirect_uri");
    url.searchParams.delete("state");
    const authorizeBase = `${url.origin}${url.pathname}`.replace(/\/$/, "");
    if (!authorizeBase.includes("/oauth/")) return null;

    return { authorizeBase, clientId };
  } catch {
    return null;
  }
}

function resolveStripeOAuthFromEnv(
  env: Record<string, string | undefined>,
): { clientId?: string; authorizeBaseUrl?: string } {
  const installLink = sanitizeStripeEnvValue(env.STRIPE_APP_OAUTH_INSTALL_LINK);
  if (installLink) {
    const parsed = parseStripeOAuthInstallLink(installLink);
    if (parsed) {
      return {
        clientId: parsed.clientId,
        authorizeBaseUrl: parsed.authorizeBase,
      };
    }
  }

  return {
    clientId: sanitizeStripeEnvValue(env.STRIPE_APP_CLIENT_ID),
    authorizeBaseUrl: sanitizeStripeEnvValue(env.STRIPE_APP_OAUTH_AUTHORIZE_URL),
  };
}

export function readStripeOAuthEnv(
  env: Record<string, string | undefined> = process.env,
): StripeOAuthEnv {
  const resolved = resolveStripeOAuthFromEnv(env);
  return {
    clientId: resolved.clientId,
    authorizeBaseUrl: resolved.authorizeBaseUrl,
    redirectUri: sanitizeStripeEnvValue(env.STRIPE_APP_REDIRECT_URI),
    siteUrl: sanitizeStripeEnvValue(env.NEXT_PUBLIC_SITE_URL),
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
    throw new Error(
      "OAuth Stripe non configuré — définissez STRIPE_APP_OAUTH_INSTALL_LINK (lien Test OAuth complet) ou STRIPE_APP_CLIENT_ID",
    );
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
