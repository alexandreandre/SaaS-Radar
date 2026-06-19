import "server-only";

import { parseGoogleAnalyticsConnectInput } from "@/lib/connectors/google-analytics/keys";
import {
  buildAccessTokenExpiry,
  refreshGoogleAnalyticsAccessToken,
} from "@/lib/connectors/google-analytics/oauth";
import { normalizePropertyId } from "@/lib/connectors/google-analytics/snapshots";
import type {
  GaAccountSummariesListResponse,
  GaBatchRunReportsResponse,
  GaEventSummary,
  GaPropertySummary,
  GaRunReportResponse,
  GoogleAnalyticsCredential,
} from "@/lib/connectors/google-analytics/types";

const ADMIN_API_BASE = "https://analyticsadmin.googleapis.com/v1beta";
const DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const GA4_PROPERTY_TYPE = "PROPERTY_TYPE_ORDINARY";

export class GoogleAnalyticsConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GoogleAnalyticsConnectorError";
    this.status = status;
  }
}

function parseGoogleError(body: unknown, status: number): GoogleAnalyticsConnectorError {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const error = record.error as Record<string, unknown> | undefined;
    const message =
      (typeof error?.message === "string" && error.message) ||
      (typeof record.message === "string" && record.message) ||
      "Erreur Google Analytics";
    if (status === 403) {
      return new GoogleAnalyticsConnectorError(
        `${message} — vérifiez que l'utilisateur a accès à la propriété GA4 et que les APIs Analytics sont activées dans Google Cloud.`,
        status,
      );
    }
    if (status === 429) {
      return new GoogleAnalyticsConnectorError(
        `${message} — quota GA4 Data API dépassé. Réessayez plus tard.`,
        status,
      );
    }
    return new GoogleAnalyticsConnectorError(message, status);
  }
  return new GoogleAnalyticsConnectorError("Erreur Google Analytics", status);
}

async function googleAnalyticsRequest<T>(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    throw parseGoogleError(body, res.status);
  }

  return body as T;
}

export async function ensureFreshAccessToken(credential: GoogleAnalyticsCredential): Promise<{
  credential: GoogleAnalyticsCredential;
  refreshed: boolean;
}> {
  const expiresAt = new Date(credential.accessTokenExpiresAt).getTime();
  const stillValid = Number.isFinite(expiresAt) && expiresAt - Date.now() > 60_000;

  if (stillValid && credential.accessToken) {
    return { credential, refreshed: false };
  }

  if (!credential.refreshToken) {
    throw new GoogleAnalyticsConnectorError(
      "Session Google Analytics expirée — réautorisez l'accès OAuth",
      401,
    );
  }

  const tokens = await refreshGoogleAnalyticsAccessToken(credential.refreshToken);
  return {
    credential: {
      ...credential,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    },
    refreshed: true,
  };
}

function extractPropertyId(propertyResource: string): string {
  return normalizePropertyId(propertyResource);
}

export async function listAccessibleProperties(
  credential: GoogleAnalyticsCredential,
): Promise<GaPropertySummary[]> {
  const properties: GaPropertySummary[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "200" });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await googleAnalyticsRequest<GaAccountSummariesListResponse>(
      `${ADMIN_API_BASE}/accountSummaries?${params.toString()}`,
      credential.accessToken,
    );

    for (const account of data.accountSummaries ?? []) {
      const accountDisplayName = account.displayName?.trim() || "Compte Google Analytics";
      for (const property of account.propertySummaries ?? []) {
        if (property.propertyType && property.propertyType !== GA4_PROPERTY_TYPE) {
          continue;
        }
        const propertyId = property.property ? extractPropertyId(property.property) : "";
        if (!propertyId) continue;
        properties.push({
          propertyId,
          displayName: property.displayName?.trim() || `Propriété ${propertyId}`,
          accountDisplayName,
        });
      }
    }

    pageToken = data.nextPageToken || undefined;
  } while (pageToken);

  return properties.sort((a, b) =>
    `${a.accountDisplayName} ${a.displayName}`.localeCompare(
      `${b.accountDisplayName} ${b.displayName}`,
    ),
  );
}

function eventNameFilter(eventName: string) {
  return {
    filter: {
      fieldName: "eventName",
      stringFilter: {
        matchType: "EXACT",
        value: eventName,
      },
    },
  };
}

function buildDateRange(start: string, end: string) {
  return [{ startDate: start, endDate: end }];
}

export async function listPropertyEvents(
  credential: GoogleAnalyticsCredential,
  propertyId: string,
): Promise<GaEventSummary[]> {
  const normalizedId = normalizePropertyId(propertyId);
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);

  const format = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const data = await googleAnalyticsRequest<GaRunReportResponse>(
    `${DATA_API_BASE}/properties/${normalizedId}:runReport`,
    credential.accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        dateRanges: buildDateRange(format(start), format(end)),
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "200",
        returnPropertyQuota: true,
      }),
    },
  );

  return (data.rows ?? [])
    .map((row) => ({
      name: row.dimensionValues?.[0]?.value?.trim() ?? "",
      count: Math.max(0, Number(row.metricValues?.[0]?.value ?? 0)),
    }))
    .filter((event) => event.name.length > 0);
}

export async function validateGoogleAnalyticsProperty(
  credential: GoogleAnalyticsCredential,
  propertyId: string,
): Promise<GaPropertySummary> {
  const normalizedId = normalizePropertyId(propertyId);
  const properties = await listAccessibleProperties(credential);
  const match = properties.find((p) => p.propertyId === normalizedId);
  if (!match) {
    throw new GoogleAnalyticsConnectorError(
      "Propriété GA4 inaccessible — vérifiez les permissions de votre compte Google Analytics",
      403,
    );
  }
  return match;
}

export async function batchRunAnalyticsReports(
  credential: GoogleAnalyticsCredential,
  input: {
    propertyId: string;
    startDate: string;
    endDate: string;
    signupEvent?: string | null;
    trialEvent?: string | null;
  },
): Promise<GaRunReportResponse[]> {
  const normalizedId = normalizePropertyId(input.propertyId);
  const dateRanges = buildDateRange(input.startDate, input.endDate);

  const requests: Record<string, unknown>[] = [
    {
      dateRanges,
      dimensions: [{ name: "yearMonth" }],
      metrics: [{ name: "activeUsers" }],
      returnPropertyQuota: true,
    },
    {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }],
      returnPropertyQuota: true,
    },
  ];

  if (input.signupEvent) {
    requests.push({
      dateRanges,
      dimensions: [{ name: "yearMonth" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventNameFilter(input.signupEvent),
      returnPropertyQuota: true,
    });
  }

  if (input.trialEvent) {
    requests.push({
      dateRanges,
      dimensions: [{ name: "yearMonth" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventNameFilter(input.trialEvent),
      returnPropertyQuota: true,
    });
  }

  const data = await googleAnalyticsRequest<GaBatchRunReportsResponse>(
    `${DATA_API_BASE}/properties/${normalizedId}:batchRunReports`,
    credential.accessToken,
    {
      method: "POST",
      body: JSON.stringify({ requests }),
    },
  );

  return data.reports ?? [];
}

export function buildAccountLabel(credential: GoogleAnalyticsCredential): string {
  if (credential.propertyDisplayName && credential.propertyId) {
    return `${credential.propertyDisplayName} (${credential.propertyId})`;
  }
  if (credential.propertyDisplayName) return credential.propertyDisplayName;
  if (credential.propertyId) return `GA4 ${credential.propertyId}`;
  return "Google Analytics";
}

export async function validateGoogleAnalyticsCredential(
  credential: GoogleAnalyticsCredential,
): Promise<{ accountLabel: string; property: GaPropertySummary }> {
  if (!credential.propertyId) {
    throw new GoogleAnalyticsConnectorError("Propriété GA4 non sélectionnée", 400);
  }

  const { credential: freshCredential } = await ensureFreshAccessToken(credential);
  const property = await validateGoogleAnalyticsProperty(
    freshCredential,
    credential.propertyId,
  );

  return {
    accountLabel: buildAccountLabel({
      ...freshCredential,
      propertyDisplayName: property.displayName,
    }),
    property,
  };
}

export { parseGoogleAnalyticsConnectInput };
