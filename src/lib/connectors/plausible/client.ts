import "server-only";

import type {
  PlausibleAccountMeta,
  PlausibleCredential,
  PlausibleGoalsResponse,
  PlausibleQueryResponse,
  PlausibleSiteResponse,
  PlausibleStatsQuery,
} from "@/lib/connectors/plausible/types";

export { parsePlausibleCredential } from "@/lib/connectors/plausible/keys";

const DEFAULT_API_BASE = "https://plausible.io";

export class PlausibleConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PlausibleConnectorError";
    this.status = status;
  }
}

export function getPlausibleApiBase(credential?: Pick<PlausibleCredential, "apiBaseUrl">): string {
  const fromCredential = credential?.apiBaseUrl?.trim();
  if (fromCredential) return fromCredential.replace(/\/$/, "");

  const fromEnv = process.env.PLAUSIBLE_API_BASE?.trim();
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
    return "Clé Stats API invalide ou sans accès au site demandé.";
  }
  if (status === 403) {
    return "Stats API réservée au plan Business Plausible. Vérifiez votre abonnement.";
  }
  if (status === 404) {
    return "Site Plausible introuvable. Vérifiez le domaine saisi.";
  }

  return `Erreur Plausible (${status})`;
}

export async function plausibleConnectorRequest<T>(
  credential: PlausibleCredential,
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    searchParams?: URLSearchParams;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const base = getPlausibleApiBase(credential);
  const url = new URL(`${base}${path}`);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${credential.apiKey}`,
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), { method, headers, body });
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
    throw new PlausibleConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function runStatsQuery(
  credential: PlausibleCredential,
  query: PlausibleStatsQuery,
): Promise<PlausibleQueryResponse> {
  return plausibleConnectorRequest<PlausibleQueryResponse>(credential, "/api/v2/query", {
    method: "POST",
    body: query,
  });
}

export async function fetchSiteDetails(
  credential: PlausibleCredential,
): Promise<PlausibleSiteResponse> {
  const siteId = encodeURIComponent(credential.siteId);
  return plausibleConnectorRequest<PlausibleSiteResponse>(credential, `/api/v1/sites/${siteId}`);
}

export async function fetchSiteGoals(credential: PlausibleCredential): Promise<PlausibleGoalsResponse> {
  const params = new URLSearchParams({ site_id: credential.siteId, limit: "100" });
  return plausibleConnectorRequest<PlausibleGoalsResponse>(credential, "/api/v1/sites/goals", {
    searchParams: params,
  });
}

export function buildAccountMeta(
  credential: PlausibleCredential,
  timezone?: string,
): PlausibleAccountMeta {
  return {
    accountLabel: credential.siteId,
    timezone,
    hasSignupGoal: Boolean(credential.signupGoalDisplayName),
  };
}

export async function validateCredential(
  credential: PlausibleCredential,
): Promise<PlausibleAccountMeta> {
  await runStatsQuery(credential, {
    site_id: credential.siteId,
    metrics: ["visitors"],
    date_range: "7d",
  });

  let timezone: string | undefined;
  try {
    const site = await fetchSiteDetails(credential);
    timezone = site.timezone;
  } catch {
    // Site details optional — Stats key may lack sites:read scope
  }

  return buildAccountMeta(credential, timezone);
}
