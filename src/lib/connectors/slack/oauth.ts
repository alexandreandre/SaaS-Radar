import "server-only";

import type { SlackOAuthAccessResponse } from "@/lib/connectors/slack/types";
import { SLACK_BOT_SCOPES } from "@/lib/connectors/slack/types";

const OAUTH_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";
const OAUTH_ACCESS_URL = "https://slack.com/api/oauth.v2.access";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

export function getSlackRedirectUri(): string | null {
  const explicit = process.env.SLACK_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return null;

  return `${appUrl.replace(/\/$/, "")}/api/connectors/slack/callback`;
}

export function isSlackConfigured(): boolean {
  return !!(
    process.env.SLACK_CLIENT_ID?.trim() &&
    process.env.SLACK_CLIENT_SECRET?.trim() &&
    getSlackRedirectUri()
  );
}

export function getSlackAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("SLACK_CLIENT_ID"),
    redirect_uri: getSlackRedirectUri() ?? requireEnv("SLACK_REDIRECT_URI"),
    scope: SLACK_BOT_SCOPES.join(","),
    state,
  });

  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeSlackCode(code: string): Promise<SlackOAuthAccessResponse> {
  const body = new URLSearchParams({
    code,
    client_id: requireEnv("SLACK_CLIENT_ID"),
    client_secret: requireEnv("SLACK_CLIENT_SECRET"),
    redirect_uri: getSlackRedirectUri() ?? requireEnv("SLACK_REDIRECT_URI"),
  });

  const res = await fetch(OAUTH_ACCESS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as SlackOAuthAccessResponse;
  if (!res.ok || !data.ok || !data.access_token) {
    throw new Error(data.error ?? "Échange de token Slack échoué");
  }

  return data;
}
