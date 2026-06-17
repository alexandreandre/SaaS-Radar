import "server-only";

import type { StripeCredential, StripeAccountMeta, StripeAccountResponse } from "@/lib/connectors/stripe/types";
export { isFullSecretKey, isRestrictedKey, parseRakCredential } from "@/lib/connectors/stripe/keys";

const STRIPE_API_BASE = "https://api.stripe.com";
export const STRIPE_ANALYTICS_VERSION = "2026-04-22.preview";

export class StripeConnectorError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "StripeConnectorError";
  }
}

function getBearerToken(credential: StripeCredential): string {
  return credential.mode === "rak" ? credential.secretKey : credential.accessToken;
}

function getStripeAccountHeader(credential: StripeCredential): string | undefined {
  if (credential.mode === "oauth") return credential.stripeAccountId;
  return credential.accountId;
}

export async function stripeConnectorRequest<T>(
  credential: StripeCredential,
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    apiVersion?: string;
    formBody?: URLSearchParams;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getBearerToken(credential)}`,
  };

  const stripeAccount = getStripeAccountHeader(credential);
  if (stripeAccount) {
    headers["Stripe-Account"] = stripeAccount;
  }

  if (options.apiVersion) {
    headers["Stripe-Version"] = options.apiVersion;
  }

  let body: string | undefined;
  if (options.formBody) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = options.formBody.toString();
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${STRIPE_API_BASE}${path}`, { method, headers, body });
  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    const err = parsed.error as { message?: string; code?: string } | undefined;
    throw new StripeConnectorError(
      err?.message ?? `Erreur Stripe (${res.status})`,
      err?.code,
      res.status,
    );
  }

  return parsed as T;
}

export async function fetchStripeAccount(credential: StripeCredential): Promise<StripeAccountResponse> {
  return stripeConnectorRequest<StripeAccountResponse>(credential, "/v1/account");
}

export function buildAccountMeta(
  account: StripeAccountResponse,
  credential: StripeCredential,
): StripeAccountMeta {
  const name =
    account.business_profile?.name?.trim() ||
    account.settings?.dashboard?.display_name?.trim() ||
    account.id;
  const currency = credential.currency || account.default_currency || "eur";
  const modeLabel = credential.livemode ? "Live" : "Test";
  return {
    accountLabel: `Stripe · ${name} (${modeLabel})`,
    livemode: credential.livemode,
    currency: currency.toLowerCase(),
    defaultCurrency: account.default_currency?.toLowerCase(),
    businessName: name,
  };
}

export async function validateCredential(credential: StripeCredential): Promise<StripeAccountMeta> {
  const account = await fetchStripeAccount(credential);
  const enriched: StripeCredential =
    credential.mode === "rak" && !credential.accountId
      ? { ...credential, accountId: account.id }
      : credential;

  // Test Analytics access with a minimal query
  const now = new Date();
  const startsAt = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  await stripeConnectorRequest(
    enriched,
    "/v2/data/analytics/metric_query",
    {
      method: "POST",
      apiVersion: STRIPE_ANALYTICS_VERSION,
      body: {
        metrics: [{ name: "revenue.mrr" }],
        starts_at: startsAt.toISOString(),
        ends_at: now.toISOString(),
        granularity: "month",
        currency: enriched.currency,
      },
    },
  );

  return buildAccountMeta(account, enriched);
}
