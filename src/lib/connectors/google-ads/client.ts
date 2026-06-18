import "server-only";

import {
  GOOGLE_ADS_API_VERSION,
  normalizeCustomerId,
} from "@/lib/connectors/google-ads/snapshots";
import {
  buildAccessTokenExpiry,
  refreshGoogleAdsAccessToken,
} from "@/lib/connectors/google-ads/oauth";
import type {
  GoogleAdsAccountSummary,
  GoogleAdsCredential,
  GoogleAdsGaqlRow,
  GoogleAdsSearchStreamChunk,
} from "@/lib/connectors/google-ads/types";

const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export class GoogleAdsConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GoogleAdsConnectorError";
    this.status = status;
  }
}

function getDeveloperToken(): string {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  if (!token) {
    throw new GoogleAdsConnectorError(
      "Developer token Google Ads non configuré (GOOGLE_ADS_DEVELOPER_TOKEN)",
      503,
    );
  }
  return token;
}

function resolveLoginCustomerId(
  credential: GoogleAdsCredential,
  customerId: string,
): string | undefined {
  const explicit = credential.loginCustomerId?.trim();
  if (explicit) return normalizeCustomerId(explicit);

  const platform = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.trim();
  if (platform) return normalizeCustomerId(platform);

  return customerId;
}

function shouldSendLoginCustomerId(loginCustomerId: string, customerId: string): boolean {
  return loginCustomerId !== customerId;
}

function parseGoogleAdsError(body: unknown, status: number): GoogleAdsConnectorError {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const error = record.error as Record<string, unknown> | undefined;
    const message =
      (typeof error?.message === "string" && error.message) ||
      (typeof record.message === "string" && record.message) ||
      "Erreur Google Ads API";

    if (status === 401 || status === 403) {
      return new GoogleAdsConnectorError(
        "Accès Google Ads refusé. Vérifiez les permissions du compte et le developer token.",
        status,
      );
    }

    return new GoogleAdsConnectorError(message, status);
  }

  return new GoogleAdsConnectorError("Erreur Google Ads API", status);
}

export function isAccessTokenExpired(credential: GoogleAdsCredential): boolean {
  const expiresAt = new Date(credential.accessTokenExpiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt <= Date.now() + 60_000;
}

export async function ensureFreshAccessToken(
  credential: GoogleAdsCredential,
): Promise<{ credential: GoogleAdsCredential; refreshed: boolean }> {
  if (!isAccessTokenExpired(credential)) {
    return { credential, refreshed: false };
  }

  const refreshedTokens = await refreshGoogleAdsAccessToken(credential.refreshToken);
  return {
    credential: {
      ...credential,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpiresAt: buildAccessTokenExpiry(refreshedTokens.expiresIn),
    },
    refreshed: true,
  };
}

type GoogleAdsRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  customerId?: string;
};

export async function googleAdsRequest<T>(
  credential: GoogleAdsCredential,
  path: string,
  options: GoogleAdsRequestOptions = {},
): Promise<T> {
  const customerId = options.customerId
    ? normalizeCustomerId(options.customerId)
    : credential.customerId
      ? normalizeCustomerId(credential.customerId)
      : undefined;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${credential.accessToken}`,
    "developer-token": getDeveloperToken(),
    "Content-Type": "application/json",
  };

  if (customerId) {
    const loginCustomerId = resolveLoginCustomerId(credential, customerId);
    if (loginCustomerId && shouldSendLoginCustomerId(loginCustomerId, customerId)) {
      headers["login-customer-id"] = loginCustomerId;
    }
  }

  const res = await fetch(`${GOOGLE_ADS_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw parseGoogleAdsError(body, res.status);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export async function listAccessibleCustomerIds(
  credential: GoogleAdsCredential,
): Promise<string[]> {
  const data = await googleAdsRequest<{ resourceNames?: string[] }>(
    credential,
    "/customers:listAccessibleCustomers",
  );

  return (data.resourceNames ?? [])
    .map((name) => normalizeCustomerId(name))
    .filter(Boolean);
}

export async function runGaqlQuery(
  credential: GoogleAdsCredential,
  customerId: string,
  query: string,
): Promise<GoogleAdsGaqlRow[]> {
  const normalizedId = normalizeCustomerId(customerId);
  const chunks = await googleAdsRequest<GoogleAdsSearchStreamChunk[]>(
    credential,
    `/customers/${normalizedId}/googleAds:searchStream`,
    {
      method: "POST",
      customerId: normalizedId,
      body: { query },
    },
  );

  const rows: GoogleAdsGaqlRow[] = [];
  for (const chunk of chunks) {
    if (chunk.results?.length) rows.push(...chunk.results);
  }
  return rows;
}

export async function fetchCustomerSummary(
  credential: GoogleAdsCredential,
  customerId: string,
): Promise<GoogleAdsAccountSummary> {
  const normalizedId = normalizeCustomerId(customerId);
  const rows = await runGaqlQuery(
    credential,
    normalizedId,
    `SELECT customer.id, customer.descriptive_name, customer.currency_code
FROM customer
LIMIT 1`,
  );

  const customer = rows[0]?.customer;
  return {
    customerId: normalizedId,
    descriptiveName: customer?.descriptiveName?.trim() || `Compte ${normalizedId}`,
    currencyCode: customer?.currencyCode,
  };
}

export async function listAccessibleAccounts(
  credential: GoogleAdsCredential,
  limit = 20,
): Promise<GoogleAdsAccountSummary[]> {
  const customerIds = (await listAccessibleCustomerIds(credential)).slice(0, limit);
  const accounts: GoogleAdsAccountSummary[] = [];

  for (const customerId of customerIds) {
    try {
      accounts.push(await fetchCustomerSummary(credential, customerId));
    } catch {
      accounts.push({
        customerId,
        descriptiveName: `Compte ${customerId}`,
      });
    }
  }

  return accounts;
}

export async function validateGoogleAdsCredential(
  credential: GoogleAdsCredential,
): Promise<GoogleAdsAccountSummary> {
  if (!credential.customerId?.trim()) {
    throw new GoogleAdsConnectorError("Compte Google Ads non sélectionné", 400);
  }

  return fetchCustomerSummary(credential, credential.customerId);
}
