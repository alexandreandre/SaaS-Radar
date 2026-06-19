import "server-only";

import { refreshZendeskToken } from "@/lib/connectors/zendesk/oauth";
import {
  buildEndUserSearchQuery,
  resolveZendeskApiBase,
} from "@/lib/connectors/zendesk/snapshots";
import type {
  ZendeskAccountSettingsResponse,
  ZendeskCredential,
  ZendeskSearchCountResponse,
  ZendeskSatisfactionRatingsResponse,
  ZendeskTicketMetric,
  ZendeskTicketMetricsResponse,
} from "@/lib/connectors/zendesk/types";

const MAX_METRICS_PAGES = 5;
const METRICS_PAGE_SIZE = 100;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export class ZendeskConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ZendeskConnectorError";
    this.status = status;
  }
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      const description =
        typeof record.description === "string" ? record.description.trim() : "";
      return description ? `${record.error}: ${description}` : record.error;
    }
    if (typeof record.description === "string" && record.description.trim()) {
      return record.description;
    }
  }

  if (status === 401) {
    return "Token Zendesk invalide ou révoqué. Reconnectez Zendesk depuis le marketplace.";
  }
  if (status === 403) {
    return "Permissions Zendesk insuffisantes. Vérifiez le scope read sur votre app OAuth.";
  }
  if (status === 404) {
    return "Compte Zendesk introuvable. Vérifiez le subdomain saisi.";
  }
  if (status === 429) {
    return "Quota API Zendesk atteint. Réessayez dans quelques minutes.";
  }

  return `Erreur Zendesk (${status})`;
}

function isAccessTokenExpired(credential: ZendeskCredential): boolean {
  if (!credential.expiresAt) return false;
  const expiresAt = Date.parse(credential.expiresAt);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt - TOKEN_REFRESH_BUFFER_MS <= Date.now();
}

export async function ensureFreshAccessToken(
  credential: ZendeskCredential,
): Promise<{ credential: ZendeskCredential; refreshed: boolean }> {
  if (!isAccessTokenExpired(credential)) {
    return { credential, refreshed: false };
  }

  if (!credential.refreshToken) {
    throw new ZendeskConnectorError(
      "Token Zendesk expiré — reconnectez Zendesk depuis le marketplace.",
      401,
    );
  }

  const refreshed = await refreshZendeskToken(credential.subdomain, credential.refreshToken);
  const expiresAt = refreshed.expiresIn
    ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
    : credential.expiresAt;
  const refreshTokenExpiresAt = refreshed.refreshTokenExpiresIn
    ? new Date(Date.now() + refreshed.refreshTokenExpiresIn * 1000).toISOString()
    : credential.refreshTokenExpiresAt;

  return {
    credential: {
      ...credential,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? credential.refreshToken,
      expiresAt,
      refreshTokenExpiresAt,
    },
    refreshed: true,
  };
}

export async function zendeskRequest<T>(
  credential: ZendeskCredential,
  path: string,
  options: { method?: "GET" | "POST"; query?: Record<string, string> } = {},
): Promise<T> {
  const base = resolveZendeskApiBase(credential.subdomain);
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
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
    throw new ZendeskConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function getAccountSettings(
  credential: ZendeskCredential,
): Promise<ZendeskAccountSettingsResponse> {
  return zendeskRequest<ZendeskAccountSettingsResponse>(credential, "/account/settings.json");
}

export async function validateZendeskCredential(
  credential: ZendeskCredential,
): Promise<{ accountLabel: string; credential: ZendeskCredential }> {
  const settings = await getAccountSettings(credential);
  const accountName =
    settings.settings?.name?.trim() || credential.accountName?.trim() || credential.subdomain;

  return {
    accountLabel: accountName,
    credential: {
      ...credential,
      accountName,
    },
  };
}

export async function countSearchResults(
  credential: ZendeskCredential,
  query: string,
): Promise<number> {
  const response = await zendeskRequest<ZendeskSearchCountResponse>(credential, "/search/count", {
    query: { query },
  });
  return Math.max(0, response.count ?? 0);
}

export async function countOpenTickets(credential: ZendeskCredential): Promise<number> {
  return countSearchResults(credential, "type:ticket status:open");
}

export async function countActiveEndUsersInMonth(
  credential: ZendeskCredential,
  monthKey: string,
): Promise<number> {
  return countSearchResults(credential, buildEndUserSearchQuery(monthKey));
}

export async function fetchCsatMetrics(
  credential: ZendeskCredential,
  range: { start: number; end: number },
): Promise<{ good: number; bad: number }> {
  const baseQuery = {
    start_time: String(range.start),
    end_time: String(range.end),
  };

  const [good, bad] = await Promise.all([
    countSatisfactionRatings(credential, { ...baseQuery, score: "good" }),
    countSatisfactionRatings(credential, { ...baseQuery, score: "bad" }),
  ]);

  return { good, bad };
}

async function countSatisfactionRatings(
  credential: ZendeskCredential,
  query: Record<string, string>,
): Promise<number> {
  let total = 0;
  let nextUrl: string | null = `${resolveZendeskApiBase(credential.subdomain)}/satisfaction_ratings.json?${new URLSearchParams(query).toString()}`;

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${credential.accessToken}`,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let parsed: ZendeskSatisfactionRatingsResponse = {};
    if (text) {
      try {
        parsed = JSON.parse(text) as ZendeskSatisfactionRatingsResponse;
      } catch {
        parsed = {};
      }
    }

    if (!res.ok) {
      throw new ZendeskConnectorError(parseErrorMessage(parsed, res.status), res.status);
    }

    const batch = parsed.satisfaction_ratings ?? [];
    total += batch.length;

    nextUrl = parsed.next_page ?? null;
    if (!nextUrl || batch.length === 0) {
      break;
    }
  }

  return total;
}

export async function fetchRecentTicketMetrics(
  credential: ZendeskCredential,
): Promise<ZendeskTicketMetric[]> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const metrics: ZendeskTicketMetric[] = [];
  let afterCursor: string | undefined;

  for (let page = 0; page < MAX_METRICS_PAGES; page += 1) {
    const query: Record<string, string> = {
      "page[size]": String(METRICS_PAGE_SIZE),
      sort: "-created_at",
    };
    if (afterCursor) {
      query["page[after]"] = afterCursor;
    }

    const response = await zendeskRequest<ZendeskTicketMetricsResponse>(
      credential,
      "/ticket_metrics",
      { query },
    );

    const batch = response.ticket_metrics ?? [];
    let reachedOlder = false;

    for (const metric of batch) {
      const createdAt = metric.created_at;
      if (createdAt && createdAt < cutoff) {
        reachedOlder = true;
        continue;
      }
      metrics.push(metric);
    }

    const nextCursor = response.meta?.after_cursor;
    if (reachedOlder || !response.meta?.has_more || !nextCursor || batch.length < METRICS_PAGE_SIZE) {
      break;
    }
    afterCursor = nextCursor;
  }

  return metrics;
}
