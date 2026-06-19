import "server-only";

import type {
  FathomAccount,
  FathomAccountMeta,
  FathomAggregationParams,
  FathomAggregationRow,
  FathomCredential,
  FathomEventsListResponse,
  FathomSite,
  FathomSitesListResponse,
} from "@/lib/connectors/fathom/types";

export { parseFathomCredential } from "@/lib/connectors/fathom/keys";

const DEFAULT_API_BASE = "https://api.usefathom.com/v1";

export class FathomConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FathomConnectorError";
    this.status = status;
  }
}

function getApiBase(): string {
  const fromEnv = process.env.FATHOM_API_BASE?.trim();
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
    return "Clé API Fathom invalide ou expirée.";
  }
  if (status === 403) {
    return "Cette clé API n'a pas la permission d'accéder à cette ressource.";
  }
  if (status === 404) {
    return "Site Fathom introuvable. Vérifiez l'ID du site.";
  }
  if (status === 429) {
    return "Limite de requêtes Fathom atteinte (10/min sur les agrégations). Réessayez dans une minute.";
  }

  return `Erreur Fathom (${status})`;
}

export async function fathomConnectorRequest<T>(
  credential: Pick<FathomCredential, "apiKey">,
  path: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    searchParams?: URLSearchParams;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const url = new URL(`${getApiBase()}${path}`);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${credential.apiKey}`,
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
    throw new FathomConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

async function listAllSites(credential: FathomCredential): Promise<FathomSite[]> {
  const sites: FathomSite[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({ limit: "100" });
    if (startingAfter) params.set("starting_after", startingAfter);

    const response = await fathomConnectorRequest<FathomSitesListResponse>(
      credential,
      "/sites",
      { searchParams: params },
    );

    sites.push(...(response.data ?? []));

    if (!response.has_more || response.data.length === 0) break;
    startingAfter = response.data.at(-1)?.id;
    if (!startingAfter) break;
  }

  return sites;
}

export async function fetchAccount(
  credential: FathomCredential,
): Promise<FathomAccount> {
  return fathomConnectorRequest<FathomAccount>(credential, "/account");
}

export async function fetchSites(credential: FathomCredential): Promise<FathomSite[]> {
  return listAllSites(credential);
}

export async function fetchSite(
  credential: FathomCredential,
  siteId: string,
): Promise<FathomSite> {
  return fathomConnectorRequest<FathomSite>(
    credential,
    `/sites/${encodeURIComponent(siteId)}`,
  );
}

export async function fetchSiteEvents(
  credential: FathomCredential,
  siteId: string,
): Promise<FathomEventsListResponse["data"]> {
  const events: FathomEventsListResponse["data"] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({ limit: "100" });
    if (startingAfter) params.set("starting_after", startingAfter);

    const response = await fathomConnectorRequest<FathomEventsListResponse>(
      credential,
      `/sites/${encodeURIComponent(siteId)}/events`,
      { searchParams: params },
    );

    events.push(...(response.data ?? []));

    if (!response.has_more || response.data.length === 0) break;
    startingAfter = response.data.at(-1)?.id;
    if (!startingAfter) break;
  }

  return events;
}

function aggregationParamsToSearchParams(params: FathomAggregationParams): URLSearchParams {
  const search = new URLSearchParams();
  search.set("entity", params.entity);
  search.set("aggregates", params.aggregates);

  if (params.entity_id) search.set("entity_id", params.entity_id);
  if (params.site_id) search.set("site_id", params.site_id);
  if (params.entity_name) search.set("entity_name", params.entity_name);
  if (params.date_grouping) search.set("date_grouping", params.date_grouping);
  if (params.date_from) search.set("date_from", params.date_from);
  if (params.date_to) search.set("date_to", params.date_to);
  if (params.sort_by) search.set("sort_by", params.sort_by);
  if (params.limit !== undefined) search.set("limit", String(params.limit));

  return search;
}

export async function runAggregation(
  credential: FathomCredential,
  params: FathomAggregationParams,
): Promise<FathomAggregationRow[]> {
  const searchParams = aggregationParamsToSearchParams(params);
  const result = await fathomConnectorRequest<FathomAggregationRow[]>(
    credential,
    "/aggregations",
    { searchParams },
  );
  return Array.isArray(result) ? result : [];
}

export function buildAccountMeta(
  credential: FathomCredential,
  siteName?: string,
  timezone?: string,
): FathomAccountMeta {
  return {
    accountLabel: siteName ?? credential.siteId,
    timezone,
    hasSignupEvent: Boolean(credential.signupEventId),
  };
}

export async function validateCredential(
  credential: FathomCredential,
): Promise<FathomAccountMeta> {
  await fetchAccount(credential);

  let siteName: string | undefined;
  let timezone: string | undefined;

  try {
    const site = await fetchSite(credential, credential.siteId);
    siteName = site.name;
    timezone = site.timezone;
  } catch {
    const sites = await fetchSites(credential);
    const match = sites.find((s) => s.id === credential.siteId);
    if (!match) {
      throw new FathomConnectorError(
        "Site Fathom introuvable pour cette clé API. Vérifiez l'ID du site.",
        404,
      );
    }
    siteName = match.name;
    timezone = match.timezone;
  }

  await runAggregation(credential, {
    entity: "pageview",
    entity_id: credential.siteId,
    aggregates: "visits",
    date_grouping: "month",
    date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  return buildAccountMeta(credential, siteName, timezone);
}
