import "server-only";

import {
  buildAccessTokenExpiry,
  isPennylaneOAuthConfigured,
  refreshPennylaneAccessToken,
} from "@/lib/connectors/pennylane/oauth";
import { getPennylaneBearerToken } from "@/lib/connectors/pennylane/keys";
import {
  hasTrialBalanceScope,
  isSandboxCompany,
  REQUIRED_TRIAL_BALANCE_SCOPE,
} from "@/lib/connectors/pennylane/accounting-stream";
import type {
  PennylaneAccountMeta,
  PennylaneCredential,
  PennylaneCustomerInvoice,
  PennylaneCustomerInvoicesResponse,
  PennylaneMeResponse,
  PennylaneOAuthCredential,
  PennylaneSupplierInvoice,
  PennylaneSupplierInvoicesResponse,
  PennylaneTrialBalanceItem,
  PennylaneTrialBalanceResponse,
} from "@/lib/connectors/pennylane/types";

export { parsePennylaneCredential, parsePennylaneCompanyTokenCredential } from "@/lib/connectors/pennylane/keys";

const DEFAULT_API_BASE = "https://app.pennylane.com/api/external/v2";

export class PennylaneConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PennylaneConnectorError";
    this.status = status;
  }
}

function getApiBase(): string {
  const fromEnv = process.env.PENNYLANE_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_API_BASE;
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
  }

  if (status === 401) {
    return "Token Pennylane invalide ou expiré. Régénérez-le dans Paramètres > Connectivité > Développeurs.";
  }
  if (status === 403) {
    return `Permission manquante sur le token Pennylane (scope ${REQUIRED_TRIAL_BALANCE_SCOPE} requis pour la balance).`;
  }
  if (status === 429) {
    return "Limite de requêtes Pennylane atteinte. Réessayez dans quelques secondes.";
  }

  return `Erreur Pennylane (${status})`;
}

function isTokenExpired(credential: PennylaneOAuthCredential): boolean {
  const expiresAt = new Date(credential.expiresAt).getTime();
  if (Number.isNaN(expiresAt)) return true;
  return Date.now() >= expiresAt - 60_000;
}

export async function ensureFreshAccessToken(
  credential: PennylaneCredential,
): Promise<{ credential: PennylaneCredential; refreshed: boolean }> {
  if (credential.authType !== "oauth") {
    return { credential, refreshed: false };
  }

  if (!isPennylaneOAuthConfigured()) {
    return { credential, refreshed: false };
  }

  if (!isTokenExpired(credential)) {
    return { credential, refreshed: false };
  }

  const tokens = await refreshPennylaneAccessToken(credential.refreshToken);
  const next: PennylaneOAuthCredential = {
    ...credential,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: buildAccessTokenExpiry(tokens.expiresIn),
  };

  return { credential: next, refreshed: true };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pennylaneConnectorRequest<T>(
  credential: PennylaneCredential,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    searchParams?: URLSearchParams;
    retries?: number;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const maxRetries = options.retries ?? 2;
  let attempt = 0;

  while (true) {
    const url = new URL(`${getApiBase()}${path}`);
    if (options.searchParams) {
      options.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${getPennylaneBearerToken(credential)}`,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let parsed: unknown = {};
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }
    }

    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = Number.parseInt(res.headers.get("retry-after") ?? "2", 10);
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000);
      attempt += 1;
      continue;
    }

    if (!res.ok) {
      throw new PennylaneConnectorError(parseErrorMessage(parsed, res.status), res.status);
    }

    return parsed as T;
  }
}

export async function fetchMe(credential: PennylaneCredential): Promise<PennylaneMeResponse> {
  return pennylaneConnectorRequest<PennylaneMeResponse>(credential, "/me");
}

export function buildAccountMetaFromMe(me: PennylaneMeResponse): PennylaneAccountMeta {
  const company = me.company;
  const companyName = company?.name?.trim() || "Entreprise Pennylane";
  const companyId = company?.id ?? 0;
  const scopes = Array.isArray(me.scopes) ? me.scopes : [];

  return {
    accountLabel: companyName,
    companyId,
    companyName,
    scopes,
    sandbox: isSandboxCompany(company?.reg_no),
    hasTrialBalanceScope: hasTrialBalanceScope(scopes),
  };
}

export async function validateCredential(
  credential: PennylaneCredential,
): Promise<PennylaneAccountMeta> {
  const me = await fetchMe(credential);
  const meta = buildAccountMetaFromMe(me);

  if (!meta.hasTrialBalanceScope) {
    throw new PennylaneConnectorError(
      `Le token n'inclut pas le scope ${REQUIRED_TRIAL_BALANCE_SCOPE}. Régénérez un token en lecture seule avec la permission « Balance générale ».`,
      403,
    );
  }

  return meta;
}

async function fetchTrialBalancePage(
  credential: PennylaneCredential,
  periodStart: string,
  periodEnd: string,
  cursor?: string,
): Promise<PennylaneTrialBalanceResponse> {
  const params = new URLSearchParams({
    period_start: periodStart,
    period_end: periodEnd,
    use_2026_api_changes: "true",
    limit: "1000",
  });
  if (cursor) params.set("cursor", cursor);

  return pennylaneConnectorRequest<PennylaneTrialBalanceResponse>(
    credential,
    "/trial_balance",
    { searchParams: params },
  );
}

export async function fetchAllTrialBalanceItems(
  credential: PennylaneCredential,
  periodStart: string,
  periodEnd: string,
): Promise<PennylaneTrialBalanceItem[]> {
  const items: PennylaneTrialBalanceItem[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 50; page++) {
    const response = await fetchTrialBalancePage(credential, periodStart, periodEnd, cursor);
    items.push(...(response.items ?? []));

    if (!response.has_more || !response.next_cursor) break;
    cursor = response.next_cursor;
  }

  return items;
}

async function fetchInvoicesPage<T>(
  credential: PennylaneCredential,
  path: "/customer_invoices" | "/supplier_invoices",
  periodStart: string,
  periodEnd: string,
  cursor?: string,
): Promise<{ items: T[]; hasMore: boolean; nextCursor?: string }> {
  const params = new URLSearchParams({
    use_2026_api_changes: "true",
    limit: "100",
    "filter[date][gteq]": periodStart,
    "filter[date][lteq]": periodEnd,
  });
  if (cursor) params.set("cursor", cursor);

  const response = await pennylaneConnectorRequest<
    PennylaneCustomerInvoicesResponse | PennylaneSupplierInvoicesResponse
  >(credential, path, { searchParams: params });

  return {
    items: (response.items ?? []) as T[],
    hasMore: Boolean(response.has_more),
    nextCursor: response.next_cursor ?? undefined,
  };
}

export async function fetchCustomerInvoiceTotal(
  credential: PennylaneCredential,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  let total = 0;
  let cursor: string | undefined;

  for (let page = 0; page < 50; page++) {
    const response = await fetchInvoicesPage<PennylaneCustomerInvoice>(
      credential,
      "/customer_invoices",
      periodStart,
      periodEnd,
      cursor,
    );

    for (const invoice of response.items) {
      if (invoice?.draft || invoice?.credit_note) continue;
      const amount =
        invoice?.currency_amount_before_tax ?? invoice?.currency_amount ?? "0";
      total += Number.parseFloat(String(amount).replace(",", ".")) || 0;
    }

    if (!response.hasMore || !response.nextCursor) break;
    cursor = response.nextCursor;
  }

  return total;
}

export async function fetchSupplierInvoiceTotal(
  credential: PennylaneCredential,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  let total = 0;
  let cursor: string | undefined;

  for (let page = 0; page < 50; page++) {
    const response = await fetchInvoicesPage<PennylaneSupplierInvoice>(
      credential,
      "/supplier_invoices",
      periodStart,
      periodEnd,
      cursor,
    );

    for (const invoice of response.items) {
      if (invoice?.draft) continue;
      const amount =
        invoice?.currency_amount_before_tax ?? invoice?.currency_amount ?? "0";
      total += Number.parseFloat(String(amount).replace(",", ".")) || 0;
    }

    if (!response.hasMore || !response.nextCursor) break;
    cursor = response.nextCursor;
  }

  return total;
}
