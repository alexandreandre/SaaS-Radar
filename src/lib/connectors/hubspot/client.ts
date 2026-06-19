import "server-only";

import {
  buildAccessTokenExpiry,
  refreshHubSpotAccessToken,
} from "@/lib/connectors/hubspot/oauth";
import type {
  HubSpotAccessTokenInfo,
  HubSpotCredential,
  HubSpotDeal,
  HubSpotDealsSearchResponse,
  HubSpotPipelinesResponse,
  HubSpotSearchFilter,
  HubSpotSearchRequest,
} from "@/lib/connectors/hubspot/types";

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const SEARCH_PAGE_LIMIT = 100;
const MAX_SEARCH_PAGES = 100;

export class HubSpotConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "HubSpotConnectorError";
    this.status = status;
  }
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      if (record.category === "MISSING_SCOPES") {
        return `${record.message} — scopes requis : crm.objects.deals.read. Voir https://developers.hubspot.com/scopes`;
      }
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  if (status === 401) {
    return "Token HubSpot invalide ou expiré. Reconnectez HubSpot depuis le marketplace.";
  }
  if (status === 403) {
    return "Permissions HubSpot insuffisantes. Vérifiez le scope crm.objects.deals.read.";
  }
  if (status === 429) {
    return "Quota API HubSpot atteint. Réessayez dans quelques minutes.";
  }

  return `Erreur HubSpot (${status})`;
}

export function buildHubSpotAccountLabel(credential: HubSpotCredential): string {
  if (credential.portalLabel?.trim()) return credential.portalLabel.trim();
  if (credential.hubDomain?.trim()) return credential.hubDomain.trim();
  if (credential.hubId) return `HubSpot ${credential.hubId}`;
  return "HubSpot";
}

export function isAccessTokenExpired(credential: HubSpotCredential): boolean {
  const expiresAt = new Date(credential.accessTokenExpiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt <= Date.now() + 60_000;
}

export async function ensureFreshAccessToken(
  credential: HubSpotCredential,
): Promise<{ credential: HubSpotCredential; refreshed: boolean }> {
  if (!isAccessTokenExpired(credential)) {
    return { credential, refreshed: false };
  }

  const refreshedTokens = await refreshHubSpotAccessToken(credential.refreshToken);
  return {
    credential: {
      ...credential,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? credential.refreshToken,
      accessTokenExpiresAt: buildAccessTokenExpiry(refreshedTokens.expiresIn),
    },
    refreshed: true,
  };
}

export async function hubspotRequest<T>(
  accessToken: string,
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
  } = {},
): Promise<T> {
  const url = `${HUBSPOT_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url, { method, headers, body });
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
    throw new HubSpotConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function getAccessTokenInfo(accessToken: string): Promise<HubSpotAccessTokenInfo> {
  return hubspotRequest<HubSpotAccessTokenInfo>(accessToken, `/oauth/v1/access-tokens/${accessToken}`);
}

export async function fetchDealPipelines(accessToken: string): Promise<HubSpotPipelinesResponse> {
  return hubspotRequest<HubSpotPipelinesResponse>(accessToken, "/crm/v3/pipelines/deals");
}

const DEAL_PROPERTIES = ["amount", "dealname", "dealstage", "pipeline", "closedate", "createdate"];

export async function searchDeals(
  accessToken: string,
  filters: HubSpotSearchFilter[],
  options?: { after?: string; limit?: number },
): Promise<HubSpotDealsSearchResponse> {
  const body: HubSpotSearchRequest = {
    filterGroups: [{ filters }],
    properties: DEAL_PROPERTIES,
    limit: options?.limit ?? SEARCH_PAGE_LIMIT,
  };

  if (options?.after) {
    body.after = options.after;
  }

  return hubspotRequest<HubSpotDealsSearchResponse>(
    accessToken,
    "/crm/v3/objects/deals/search",
    { method: "POST", body },
  );
}

export async function searchAllDeals(
  accessToken: string,
  filters: HubSpotSearchFilter[],
): Promise<HubSpotDeal[]> {
  const results: NonNullable<HubSpotDealsSearchResponse["results"]> = [];
  let after: string | undefined;

  for (let page = 0; page < MAX_SEARCH_PAGES; page += 1) {
    const response = await searchDeals(accessToken, filters, { after });
    const batch = response.results ?? [];
    results.push(...batch);

    const nextAfter = response.paging?.next?.after;
    if (!nextAfter || batch.length === 0) break;
    after = nextAfter;
  }

  return results;
}

export async function searchDealsInStages(
  accessToken: string,
  stageIds: string[],
  extraFilters: HubSpotSearchFilter[] = [],
): Promise<HubSpotDeal[]> {
  if (stageIds.length === 0) return [];

  const filters: HubSpotSearchFilter[] = [
    { propertyName: "dealstage", operator: "IN", values: stageIds },
    ...extraFilters,
  ];

  return searchAllDeals(accessToken, filters);
}

export async function validateHubSpotCredential(
  credential: HubSpotCredential,
): Promise<{ accountLabel: string; credential: HubSpotCredential }> {
  const { credential: fresh } = await ensureFreshAccessToken(credential);
  const info = await getAccessTokenInfo(fresh.accessToken);

  const nextCredential: HubSpotCredential = {
    ...fresh,
    hubId: info.hub_id !== undefined ? String(info.hub_id) : fresh.hubId,
    hubDomain: info.hub_domain ?? fresh.hubDomain,
    portalLabel: info.hub_domain ?? fresh.portalLabel,
  };

  return {
    accountLabel: buildHubSpotAccountLabel(nextCredential),
    credential: nextCredential,
  };
}
