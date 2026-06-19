import "server-only";

import type { StripeCredential, StripeAccountMeta, StripeAccountResponse } from "@/lib/connectors/stripe/types";
import { StripeConnectorError } from "@/lib/connectors/stripe/errors";
export { isFullSecretKey, isRestrictedKey, parseRakCredential } from "@/lib/connectors/stripe/keys";
export { StripeConnectorError } from "@/lib/connectors/stripe/errors";

const STRIPE_API_BASE = "https://api.stripe.com";
export const STRIPE_ANALYTICS_VERSION = "2026-04-22.preview";

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
    Authorization: `Bearer ${credential.secretKey}`,
  };

  if (credential.accountId) {
    headers["Stripe-Account"] = credential.accountId;
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

async function smokeTestSubscriptionsRead(credential: StripeCredential): Promise<void> {
  try {
    await stripeConnectorRequest(credential, "/v1/subscriptions?status=active&limit=1");
  } catch (err) {
    if (err instanceof StripeConnectorError) {
      throw new StripeConnectorError(
        "Permission Subscriptions — Read requise sur la clé restreinte Stripe.",
        err.code,
        err.status,
      );
    }
    throw err;
  }
}

export type ValidateCredentialResult = {
  meta: StripeAccountMeta;
  credential: StripeCredential;
};

export async function validateCredential(
  credential: StripeCredential,
): Promise<ValidateCredentialResult> {
  const account = await fetchStripeAccount(credential);
  const enriched: StripeCredential = !credential.accountId
    ? { ...credential, accountId: account.id }
    : credential;

  await smokeTestSubscriptionsRead(enriched);

  return {
    meta: buildAccountMeta(account, enriched),
    credential: enriched,
  };
}
