import "server-only";

import {
  buildAccessTokenExpiry,
  refreshQontoAccessToken,
} from "@/lib/connectors/qonto/oauth";
import type {
  QontoApiError,
  QontoCredential,
  QontoOrganizationResponse,
  QontoTransaction,
  QontoTransactionsResponse,
} from "@/lib/connectors/qonto/types";

const DEFAULT_API_BASE = "https://thirdparty.qonto.com/v2";
const TRANSACTIONS_PER_PAGE = 100;
const MAX_TRANSACTION_PAGES = 50;

export class QontoConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "QontoConnectorError";
    this.status = status;
  }
}

export function getQontoApiBase(): string {
  const base = process.env.QONTO_API_BASE?.trim();
  if (base) return base.replace(/\/$/, "");
  return DEFAULT_API_BASE;
}

function parseQontoError(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as QontoApiError;
    const first = record.errors?.[0];
    if (first) {
      const detail = first.detail ?? first.message;
      if (typeof detail === "string" && detail.trim()) return detail;
      if (typeof first.code === "string" && first.code.trim()) return first.code;
    }
  }

  if (status === 401) {
    return "Token Qonto invalide ou révoqué. Reconnectez Qonto depuis le marketplace Intégrations.";
  }
  if (status === 403) {
    return "Permissions Qonto insuffisantes — seuls les owners/admins voient les soldes complets. Vérifiez votre rôle dans Qonto.";
  }
  if (status === 429) {
    return "Quota API Qonto atteint. Réessayez dans quelques minutes.";
  }

  return `Erreur Qonto (${status})`;
}

export async function ensureFreshAccessToken(credential: QontoCredential): Promise<{
  credential: QontoCredential;
  refreshed: boolean;
}> {
  const expiresAt = new Date(credential.accessTokenExpiresAt).getTime();
  const stillValid = Number.isFinite(expiresAt) && expiresAt - Date.now() > 60_000;

  if (stillValid && credential.accessToken) {
    return { credential, refreshed: false };
  }

  if (!credential.refreshToken) {
    throw new QontoConnectorError(
      "Refresh token Qonto manquant — reconnectez Qonto depuis le marketplace Intégrations",
    );
  }

  const tokens = await refreshQontoAccessToken(credential.refreshToken);
  return {
    credential: {
      ...credential,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    },
    refreshed: true,
  };
}

export async function qontoRequest<T>(
  credential: QontoCredential,
  path: string,
  params?: Record<string, string | number | undefined | string[]>,
): Promise<T> {
  const base = getQontoApiBase();
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === "") continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${credential.accessToken}`,
    Accept: "application/json",
  };

  const stagingToken = process.env.QONTO_STAGING_TOKEN?.trim();
  if (stagingToken) {
    headers["X-Qonto-Staging-Token"] = stagingToken;
  }

  const res = await fetch(url.toString(), { method: "GET", headers });
  const text = await res.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    throw new QontoConnectorError(parseQontoError(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function getOrganization(
  credential: QontoCredential,
): Promise<QontoOrganizationResponse> {
  return qontoRequest<QontoOrganizationResponse>(credential, "/organization");
}

export async function listTransactionsForAccount(
  credential: QontoCredential,
  bankAccountId: string,
  settledFrom: string,
  settledTo: string,
): Promise<QontoTransaction[]> {
  const transactions: QontoTransaction[] = [];
  let page = 1;

  while (page <= MAX_TRANSACTION_PAGES) {
    const response = await qontoRequest<QontoTransactionsResponse>(credential, "/transactions", {
      bank_account_id: bankAccountId,
      settled_at_from: settledFrom,
      settled_at_to: settledTo,
      "status[]": ["completed"],
      per_page: TRANSACTIONS_PER_PAGE,
      page,
    });

    transactions.push(...(response.transactions ?? []));

    const nextPage = response.meta?.next_page;
    if (!nextPage || nextPage <= page) break;
    page = nextPage;
  }

  return transactions;
}

export function buildCredentialFromOrganization(
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  },
  organization: QontoOrganizationResponse["organization"],
): QontoCredential {
  const environment =
    process.env.QONTO_API_BASE?.includes("sandbox") || process.env.QONTO_STAGING_TOKEN
      ? "sandbox"
      : "production";

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    organizationId: organization.id,
    organizationSlug: organization.slug,
    organizationName: organization.legal_name?.trim() || organization.name,
    environment,
  };
}

export async function validateQontoCredential(
  credential: QontoCredential,
): Promise<{ accountLabel: string; credential: QontoCredential }> {
  const org = await getOrganization(credential);
  const accountLabel =
    org.organization.legal_name?.trim() ||
    org.organization.name?.trim() ||
    credential.organizationName ||
    "Qonto";

  return {
    accountLabel,
    credential: {
      ...credential,
      organizationId: org.organization.id,
      organizationSlug: org.organization.slug,
      organizationName: accountLabel,
    },
  };
}
