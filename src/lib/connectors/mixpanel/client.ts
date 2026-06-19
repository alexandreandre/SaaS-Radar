import "server-only";

import {
  getRegionHosts,
  normalizeRegion,
  parseMixpanelCredential,
  parseMixpanelKeyInput,
} from "@/lib/connectors/mixpanel/keys";
import type {
  MixpanelAccountMeta,
  MixpanelCredential,
  MixpanelEventDefinition,
  MixpanelMeResponse,
  MixpanelRegion,
  RetentionQueryResponse,
  SegmentationQueryResponse,
} from "@/lib/connectors/mixpanel/types";

export {
  parseMixpanelCredential,
  parseMixpanelKeyInput,
  normalizeRegion,
  getRegionHosts,
};

export class MixpanelConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "MixpanelConnectorError";
    this.status = status;
  }
}

function basicAuthHeader(username: string, secret: string): string {
  const token = Buffer.from(`${username}:${secret}`).toString("base64");
  return `Basic ${token}`;
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
    return "Service Account Mixpanel invalide ou révoqué.";
  }
  if (status === 403) {
    return "Permissions insuffisantes — le Service Account doit avoir le rôle Analyst ou Admin sur le projet. La Query API requiert un plan Growth ou Enterprise.";
  }
  if (status === 404) {
    return "Projet Mixpanel introuvable. Vérifiez le Project ID et la région (US/EU/IN).";
  }
  if (status === 429) {
    return "Limite de requêtes Mixpanel atteinte (60/h). Réessayez dans quelques minutes.";
  }

  return `Erreur Mixpanel (${status})`;
}

function appendCommonParams(
  params: URLSearchParams,
  credential: Pick<MixpanelCredential, "projectId" | "workspaceId">,
): void {
  params.set("project_id", credential.projectId);
  if (credential.workspaceId) {
    params.set("workspace_id", credential.workspaceId);
  }
}

type MixpanelAuthCredential = Pick<
  MixpanelCredential,
  "serviceAccountUsername" | "serviceAccountSecret" | "region"
>;

async function mixpanelRequest<T>(
  credential: MixpanelAuthCredential,
  baseHost: string,
  path: string,
  searchParams?: URLSearchParams,
  projectCredential?: Pick<MixpanelCredential, "projectId" | "workspaceId">,
): Promise<T> {
  const url = new URL(`https://${baseHost}${path}`);
  if (searchParams) {
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }
  if (projectCredential) {
    appendCommonParams(url.searchParams, projectCredential);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: basicAuthHeader(
        credential.serviceAccountUsername,
        credential.serviceAccountSecret,
      ),
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
    throw new MixpanelConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function fetchCurrentUser(
  credential: MixpanelAuthCredential,
): Promise<MixpanelMeResponse> {
  const { app } = getRegionHosts(credential.region);
  return mixpanelRequest<MixpanelMeResponse>(credential, app, "/api/app/me");
}

function parseEventNamesFromLexicon(data: unknown): string[] {
  const names: string[] = [];
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const items = Array.isArray(data)
    ? data
    : Array.isArray(record.results)
      ? record.results
      : Array.isArray(record.entries)
        ? record.entries
        : [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const name =
      (typeof entry.name === "string" ? entry.name : "") ||
      (typeof entry.entityName === "string" ? entry.entityName : "") ||
      (typeof entry.entity_name === "string" ? entry.entity_name : "");
    const trimmed = name.trim();
    if (trimmed) names.push(trimmed);
  }

  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}

export async function fetchEventDefinitions(
  credential: MixpanelCredential,
): Promise<MixpanelEventDefinition[]> {
  const { app } = getRegionHosts(credential.region);
  const data = await mixpanelRequest<unknown>(
    credential,
    app,
    `/api/app/projects/${credential.projectId}/schemas/event`,
    undefined,
    credential,
  );

  return parseEventNamesFromLexicon(data).map((name) => ({ name }));
}

export async function runSegmentationQuery(
  credential: MixpanelCredential,
  params: {
    event: string;
    fromDate: string;
    toDate: string;
    unit: "day" | "month";
    type?: "general" | "unique" | "average";
  },
): Promise<SegmentationQueryResponse> {
  const { query } = getRegionHosts(credential.region);
  const searchParams = new URLSearchParams({
    event: params.event,
    from_date: params.fromDate,
    to_date: params.toDate,
    unit: params.unit,
    type: params.type ?? "unique",
  });

  return mixpanelRequest<SegmentationQueryResponse>(
    credential,
    query,
    "/api/query/segmentation",
    searchParams,
    credential,
  );
}

export async function runRetentionQuery(
  credential: MixpanelCredential,
  params: {
    fromDate: string;
    toDate: string;
    bornEvent: string;
    event?: string;
    intervalCount?: number;
  },
): Promise<RetentionQueryResponse> {
  const { query } = getRegionHosts(credential.region);
  const searchParams = new URLSearchParams({
    from_date: params.fromDate,
    to_date: params.toDate,
    retention_type: "birth",
    born_event: params.bornEvent,
    unit: "day",
    interval: "1",
    interval_count: String(params.intervalCount ?? 8),
  });
  if (params.event) {
    searchParams.set("event", params.event);
  }

  return mixpanelRequest<RetentionQueryResponse>(
    credential,
    query,
    "/api/query/retention",
    searchParams,
    credential,
  );
}

export async function runEventExport(
  credential: MixpanelCredential,
  params: {
    fromDate: string;
    toDate: string;
    limit?: number;
  },
): Promise<string> {
  const { export: exportHost } = getRegionHosts(credential.region);
  const searchParams = new URLSearchParams({
    from_date: params.fromDate,
    to_date: params.toDate,
  });
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }
  appendCommonParams(searchParams, credential);

  const url = new URL(`https://${exportHost}/api/2.0/export`);
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: basicAuthHeader(
        credential.serviceAccountUsername,
        credential.serviceAccountSecret,
      ),
      Accept: "text/plain",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
    throw new MixpanelConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return text;
}

export function buildAccountMeta(credential: MixpanelCredential): MixpanelAccountMeta {
  const regionLabel = credential.region.toUpperCase();
  const projectLabel =
    credential.projectLabel?.trim() || `Projet ${credential.projectId}`;

  return {
    accountLabel: `${projectLabel} (${regionLabel})`,
    projectLabel,
    region: credential.region,
    hasSignupEvent: Boolean(credential.signupEvent),
    hasActivationEvent: Boolean(credential.activationEvent),
    hasActivityEvent: Boolean(credential.activityEvent),
  };
}

export async function validateCredential(
  credential: MixpanelCredential,
): Promise<MixpanelAccountMeta> {
  await fetchCurrentUser(credential);

  const activityEvent = credential.activityEvent ?? credential.signupEvent;
  if (activityEvent) {
    const now = new Date();
    const toDate = now.toISOString().slice(0, 10);
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    const fromDate = from.toISOString().slice(0, 10);

    await runSegmentationQuery(credential, {
      event: activityEvent,
      fromDate,
      toDate,
      unit: "day",
      type: "unique",
    });
  }

  return buildAccountMeta(credential);
}

async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(worker));
    results.push(...batchResults);
  }
  return results;
}

export async function runQueryBatch<R>(
  tasks: Array<() => Promise<R>>,
  concurrency = 3,
): Promise<R[]> {
  const runners = tasks.map((task) => () => task());
  return runInBatches(runners, concurrency, (runner) => runner());
}

export function formatDateOffset(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function getRegionLabel(region: MixpanelRegion): string {
  switch (region) {
    case "eu":
      return "EU";
    case "in":
      return "IN";
    default:
      return "US";
  }
}
