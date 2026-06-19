import "server-only";

import { buildSentryRefreshJwtClaims, signJwtHs256 } from "@/lib/connectors/sentry/jwt";
import type { SentryAuthTokenResponse } from "@/lib/connectors/sentry/types";
import { isSentryTokenExpired } from "@/lib/connectors/sentry/token";

export { isSentryTokenExpired };

const DEFAULT_API_HOST = "https://sentry.io";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function getSentryApiHost(): string {
  return process.env.SENTRY_API_HOST?.trim() || DEFAULT_API_HOST;
}

export function isSentryConfigured(): boolean {
  return !!(
    process.env.SENTRY_CLIENT_ID?.trim() &&
    process.env.SENTRY_CLIENT_SECRET?.trim() &&
    process.env.SENTRY_REDIRECT_URI?.trim() &&
    process.env.SENTRY_APP_SLUG?.trim()
  );
}

export function getSentryExternalInstallUrl(): string {
  const slug = requireEnv("SENTRY_APP_SLUG");
  return `${getSentryApiHost()}/sentry-apps/${slug}/external-install/`;
}

function authorizationsUrl(installationId: string): string {
  return `${getSentryApiHost()}/api/0/sentry-app-installations/${installationId}/authorizations/`;
}

function installationUrl(installationId: string): string {
  return `${getSentryApiHost()}/api/0/sentry-app-installations/${installationId}/`;
}

async function parseAuthResponse(res: Response): Promise<SentryAuthTokenResponse> {
  const data = (await res.json()) as SentryAuthTokenResponse & { detail?: string };
  if (!res.ok || !data.token) {
    throw new Error(data.detail ?? `Échange token Sentry échoué (${res.status})`);
  }
  return data;
}

export async function exchangeSentryInstallCode(
  installationId: string,
  code: string,
): Promise<SentryAuthTokenResponse> {
  const res = await fetch(authorizationsUrl(installationId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: requireEnv("SENTRY_CLIENT_ID"),
      client_secret: requireEnv("SENTRY_CLIENT_SECRET"),
    }),
  });

  return parseAuthResponse(res);
}

export async function refreshSentryTokenWithJwt(
  installationId: string,
): Promise<SentryAuthTokenResponse> {
  const clientId = requireEnv("SENTRY_CLIENT_ID");
  const clientSecret = requireEnv("SENTRY_CLIENT_SECRET");
  const jwtToken = signJwtHs256(buildSentryRefreshJwtClaims(clientId), clientSecret);

  const res = await fetch(authorizationsUrl(installationId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "urn:sentry:params:oauth:grant-type:jwt-bearer",
    }),
  });

  return parseAuthResponse(res);
}

export async function refreshSentryTokenWithRefreshToken(
  installationId: string,
  refreshToken: string,
): Promise<SentryAuthTokenResponse> {
  const res = await fetch(authorizationsUrl(installationId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: requireEnv("SENTRY_CLIENT_ID"),
      client_secret: requireEnv("SENTRY_CLIENT_SECRET"),
    }),
  });

  return parseAuthResponse(res);
}

export async function verifySentryInstallation(
  installationId: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(installationUrl(installationId), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "installed" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vérification installation Sentry échouée (${res.status}): ${text.slice(0, 200)}`);
  }
}
