import "server-only";

import { refreshPipedriveToken } from "@/lib/connectors/pipedrive/oauth";
import { normalizeApiDomain } from "@/lib/connectors/pipedrive/snapshots";
import type {
  PipedriveCredential,
  PipedriveDealsListResponse,
  PipedriveDealsSummaryResponse,
  PipedriveUserMeResponse,
} from "@/lib/connectors/pipedrive/types";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const MAX_WON_DEALS_PAGES = 5;
const WON_DEALS_PAGE_SIZE = 100;
const MAX_WON_DEALS_FOR_CYCLE = 200;

export class PipedriveConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PipedriveConnectorError";
    this.status = status;
  }
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      const description =
        typeof record.error_description === "string" ? record.error_description.trim() : "";
      return description ? `${record.error}: ${description}` : record.error;
    }
    if (typeof record.error_info === "string" && record.error_info.trim()) {
      return record.error_info;
    }
  }

  if (status === 401) {
    return "Token Pipedrive invalide ou révoqué. Reconnectez Pipedrive depuis le marketplace.";
  }
  if (status === 403) {
    return "Permissions Pipedrive insuffisantes. Vérifiez le scope deals:read sur votre app OAuth.";
  }
  if (status === 429) {
    return "Quota API Pipedrive atteint. Réessayez dans quelques minutes.";
  }

  return `Erreur Pipedrive (${status})`;
}

function isAccessTokenExpired(credential: PipedriveCredential): boolean {
  if (!credential.tokenExpiresAt) return false;
  const expiresAt = Date.parse(credential.tokenExpiresAt);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt - TOKEN_REFRESH_BUFFER_MS <= Date.now();
}

export async function ensureFreshAccessToken(
  credential: PipedriveCredential,
): Promise<{ credential: PipedriveCredential; refreshed: boolean }> {
  if (!isAccessTokenExpired(credential)) {
    return { credential, refreshed: false };
  }

  if (!credential.refreshToken) {
    throw new PipedriveConnectorError(
      "Token Pipedrive expiré — reconnectez Pipedrive depuis le marketplace.",
      401,
    );
  }

  const refreshed = await refreshPipedriveToken(credential.refreshToken);

  return {
    credential: {
      ...credential,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      apiDomain: refreshed.apiDomain ?? credential.apiDomain,
      tokenExpiresAt: refreshed.tokenExpiresAt ?? credential.tokenExpiresAt,
    },
    refreshed: true,
  };
}

export async function pipedriveRequest<T>(
  credential: PipedriveCredential,
  path: string,
  options: { method?: "GET" | "POST"; query?: Record<string, string> } = {},
): Promise<T> {
  const base = normalizeApiDomain(credential.apiDomain);
  if (!base) {
    throw new PipedriveConnectorError("Domaine API Pipedrive manquant dans la credential", 400);
  }

  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== "") url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${credential.accessToken}`,
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

  if (!res.ok) {
    throw new PipedriveConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function getCurrentUser(
  credential: PipedriveCredential,
): Promise<PipedriveUserMeResponse["data"]> {
  const response = await pipedriveRequest<PipedriveUserMeResponse>(credential, "/api/v1/users/me");
  return response.data ?? null;
}

export async function fetchDealsSummary(
  credential: PipedriveCredential,
  status: "open" | "won" | "lost",
): Promise<PipedriveDealsSummaryResponse["data"]> {
  const query: Record<string, string> = { status };
  if (credential.pipelineId != null) {
    query.pipeline_id = String(credential.pipelineId);
  }

  const response = await pipedriveRequest<PipedriveDealsSummaryResponse>(
    credential,
    "/api/v1/deals/summary",
    { query },
  );

  return response.data ?? null;
}

export async function fetchRecentWonDeals(
  credential: PipedriveCredential,
): Promise<NonNullable<PipedriveDealsListResponse["data"]>> {
  const deals: NonNullable<PipedriveDealsListResponse["data"]> = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_WON_DEALS_PAGES; page += 1) {
    const query: Record<string, string> = {
      status: "won",
      limit: String(WON_DEALS_PAGE_SIZE),
      sort: "won_time DESC",
    };
    if (credential.pipelineId != null) {
      query.pipeline_id = String(credential.pipelineId);
    }
    if (cursor) {
      query.cursor = cursor;
    }

    const response = await pipedriveRequest<PipedriveDealsListResponse>(
      credential,
      "/api/v2/deals",
      { query },
    );

    const batch = response.data ?? [];
    deals.push(...batch);

    if (deals.length >= MAX_WON_DEALS_FOR_CYCLE) {
      break;
    }

    const nextCursor = response.additional_data?.pagination?.next_cursor;
    const hasMore = response.additional_data?.pagination?.more_items_in_collection;
    if (!hasMore || !nextCursor) {
      break;
    }
    cursor = nextCursor;
  }

  return deals.slice(0, MAX_WON_DEALS_FOR_CYCLE);
}

export async function validatePipedriveCredential(
  credential: PipedriveCredential,
): Promise<{ accountLabel: string; credential: PipedriveCredential }> {
  const me = await getCurrentUser(credential);
  const companyName = me?.company_name?.trim() || credential.companyName || "Pipedrive";
  const companyId = me?.company_id ?? credential.companyId;

  return {
    accountLabel: companyName,
    credential: {
      ...credential,
      companyName,
      companyId,
      apiDomain: normalizeApiDomain(credential.apiDomain),
    },
  };
}

export function buildCredentialFromTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  apiDomain: string;
  tokenExpiresAt?: string;
  companyName?: string;
  companyId?: number;
}): PipedriveCredential {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    apiDomain: normalizeApiDomain(tokens.apiDomain),
    tokenExpiresAt: tokens.tokenExpiresAt,
    companyName: tokens.companyName,
    companyId: tokens.companyId,
    pipelineId: null,
  };
}
