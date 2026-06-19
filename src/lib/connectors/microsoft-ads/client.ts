import "server-only";

import {
  buildAccessTokenExpiry,
  refreshMicrosoftAdsAccessToken,
} from "@/lib/connectors/microsoft-ads/oauth";
import { MICROSOFT_ADS_API_VERSION } from "@/lib/connectors/microsoft-ads/snapshots";
import type {
  MicrosoftAdsAccountSummary,
  MicrosoftAdsCredential,
  MicrosoftAdsGetUserResponse,
  MicrosoftAdsSearchAccountsResponse,
} from "@/lib/connectors/microsoft-ads/types";

function isSandboxEnabled(): boolean {
  return process.env.MICROSOFT_ADS_USE_SANDBOX === "1";
}

function customerManagementBase(): string {
  return isSandboxEnabled()
    ? "https://clientcenter.api.sandbox.bingads.microsoft.com"
    : "https://clientcenter.api.bingads.microsoft.com";
}

function reportingBase(): string {
  return isSandboxEnabled()
    ? "https://reporting.api.sandbox.bingads.microsoft.com"
    : "https://reporting.api.bingads.microsoft.com";
}

export class MicrosoftAdsConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "MicrosoftAdsConnectorError";
    this.status = status;
  }
}

function getDeveloperToken(): string {
  const token = process.env.MICROSOFT_ADS_DEVELOPER_TOKEN?.trim();
  if (!token) {
    throw new MicrosoftAdsConnectorError(
      "Developer token Microsoft Ads non configuré (MICROSOFT_ADS_DEVELOPER_TOKEN)",
      503,
    );
  }
  return token;
}

function parseApiError(body: unknown, status: number): MicrosoftAdsConnectorError {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const errors = record.Errors as Array<{ Code?: string; Message?: string }> | undefined;
    const firstError = errors?.[0];
    const message =
      firstError?.Message ??
      (typeof record.message === "string" ? record.message : undefined) ??
      (typeof record.Message === "string" ? record.Message : undefined) ??
      "Erreur Microsoft Advertising API";

    if (status === 401 || status === 403 || firstError?.Code === "InvalidCredentials") {
      return new MicrosoftAdsConnectorError(
        "Accès Microsoft Ads refusé. Vérifiez OAuth, le developer token et les permissions du compte.",
        status,
      );
    }

    return new MicrosoftAdsConnectorError(message, status);
  }

  return new MicrosoftAdsConnectorError("Erreur Microsoft Advertising API", status);
}

export function isAccessTokenExpired(credential: MicrosoftAdsCredential): boolean {
  const expiresAt = new Date(credential.accessTokenExpiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt <= Date.now() + 60_000;
}

export async function ensureFreshAccessToken(
  credential: MicrosoftAdsCredential,
): Promise<{ credential: MicrosoftAdsCredential; refreshed: boolean }> {
  if (!isAccessTokenExpired(credential)) {
    return { credential, refreshed: false };
  }

  if (!credential.refreshToken?.trim()) {
    throw new MicrosoftAdsConnectorError(
      "Token Microsoft Ads expiré. Reconnectez votre compte via OAuth.",
      401,
    );
  }

  const provider = credential.identityProvider === "Google" ? "google" : "microsoft";
  const refreshed = await refreshMicrosoftAdsAccessToken(credential.refreshToken, provider);
  return {
    credential: {
      ...credential,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      accessTokenExpiresAt: buildAccessTokenExpiry(refreshed.expiresIn),
    },
    refreshed: true,
  };
}

type MicrosoftAdsRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  customerId?: string;
  accountId?: string;
  service?: "customer" | "reporting";
};

export async function microsoftAdsRequest<T>(
  credential: MicrosoftAdsCredential,
  path: string,
  options: MicrosoftAdsRequestOptions = {},
): Promise<T> {
  const { method = "POST", body, customerId, accountId, service = "customer" } = options;
  const base = service === "reporting" ? reportingBase() : customerManagementBase();
  const url = `${base}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${credential.accessToken}`,
    DeveloperToken: getDeveloperToken(),
    "Content-Type": "application/json",
  };

  if (credential.identityProvider === "Google") {
    headers.IdentityProvider = "Google";
  }

  const resolvedCustomerId = customerId ?? credential.customerId;
  const resolvedAccountId = accountId ?? credential.accountId;
  if (resolvedCustomerId) headers.CustomerId = resolvedCustomerId;
  if (resolvedAccountId) headers.CustomerAccountId = resolvedAccountId;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let responseBody: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      responseBody = await res.json();
    } catch {
      responseBody = null;
    }
  } else if (!res.ok) {
    responseBody = { message: await res.text() };
  }

  if (!res.ok) {
    throw parseApiError(responseBody, res.status);
  }

  return responseBody as T;
}

export async function fetchAuthenticatedUser(
  credential: MicrosoftAdsCredential,
): Promise<MicrosoftAdsGetUserResponse> {
  return microsoftAdsRequest<MicrosoftAdsGetUserResponse>(
    credential,
    `/CustomerManagement/${MICROSOFT_ADS_API_VERSION}/User/Query`,
    { body: {} },
  );
}

export async function searchAccessibleAccounts(
  credential: MicrosoftAdsCredential,
  userId: string,
): Promise<MicrosoftAdsAccountSummary[]> {
  const response = await microsoftAdsRequest<MicrosoftAdsSearchAccountsResponse>(
    credential,
    `/CustomerManagement/${MICROSOFT_ADS_API_VERSION}/Accounts/Search`,
    {
      body: {
        Predicates: [
          { Field: "UserId", Operator: "Equals", Value: userId },
          { Field: "AccountLifeCycleStatus", Operator: "Equals", Value: "Active" },
        ],
        PageInfo: { Index: 0, Size: 1000 },
        Ordering: [{ Field: "Name", Order: "Ascending" }],
      },
    },
  );

  const accounts = response.Accounts ?? [];
  return accounts
    .filter((account) => account.Id && account.Name)
    .map((account) => ({
      accountId: String(account.Id),
      customerId: String(account.ParentCustomerId ?? credential.customerId ?? ""),
      name: account.Name!,
      currencyCode: account.CurrencyCode,
      accountNumber: account.Number,
    }))
    .filter((account) => account.customerId);
}

export async function listAccessibleAccounts(
  credential: MicrosoftAdsCredential,
): Promise<MicrosoftAdsAccountSummary[]> {
  const userResponse = await fetchAuthenticatedUser(credential);
  const userId = userResponse.User?.Id;
  if (!userId) {
    throw new MicrosoftAdsConnectorError(
      "Impossible de récupérer l'utilisateur Microsoft Ads après OAuth.",
      400,
    );
  }

  return searchAccessibleAccounts(credential, String(userId));
}

export async function validateMicrosoftAdsCredential(
  credential: MicrosoftAdsCredential,
): Promise<MicrosoftAdsAccountSummary> {
  if (!credential.accountId?.trim() || !credential.customerId?.trim()) {
    throw new MicrosoftAdsConnectorError("Compte Microsoft Ads non sélectionné", 400);
  }

  const accounts = await listAccessibleAccounts(credential);
  const match = accounts.find(
    (account) =>
      account.accountId === credential.accountId && account.customerId === credential.customerId,
  );

  if (!match) {
    throw new MicrosoftAdsConnectorError(
      "Compte Microsoft Ads inaccessible avec les credentials actuels.",
      403,
    );
  }

  return match;
}

export async function fetchAccountSummary(
  credential: MicrosoftAdsCredential,
  accountId: string,
  customerId: string,
): Promise<MicrosoftAdsAccountSummary> {
  const accounts = await listAccessibleAccounts({
    ...credential,
    customerId,
    accountId,
  });
  const match = accounts.find(
    (account) => account.accountId === accountId && account.customerId === customerId,
  );
  if (!match) {
    throw new MicrosoftAdsConnectorError("Compte Microsoft Ads introuvable.", 404);
  }
  return match;
}
