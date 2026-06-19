import "server-only";

import { escapeHogQLString, normalizeAppHost } from "@/lib/connectors/posthog/keys";
import type {
  HogQLQueryResponse,
  PostHogAccountMeta,
  PostHogCredential,
  PostHogEventDefinition,
  PostHogProjectSummary,
} from "@/lib/connectors/posthog/types";

export { parsePostHogCredential, parsePostHogKeyInput } from "@/lib/connectors/posthog/keys";

export class PostHogConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PostHogConnectorError";
    this.status = status;
  }
}

type PostHogPaginated<T> = {
  results?: T[];
  count?: number;
  next?: string | null;
};

type PostHogUserMe = {
  email?: string;
  first_name?: string;
  last_name?: string;
};

type PostHogProjectRecord = {
  id: number | string;
  name?: string;
  timezone?: string;
};

type PostHogEventDefinitionRecord = {
  name?: string;
  last_seen_at?: string | null;
};

function getAppHost(credential: Pick<PostHogCredential, "appHost">): string {
  return normalizeAppHost(credential.appHost);
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (Array.isArray(record.query_status) && record.query_status.length > 0) {
      const first = record.query_status[0];
      if (first && typeof first === "object" && typeof (first as { error?: string }).error === "string") {
        return (first as { error: string }).error;
      }
    }
  }

  if (status === 401) {
    return "Personal API Key PostHog invalide ou révoquée.";
  }
  if (status === 403) {
    return "Permissions insuffisantes — ajoutez les scopes query:read, project:read et event_definition:read.";
  }
  if (status === 404) {
    return "Projet PostHog introuvable. Vérifiez le Project ID et l'URL de l'instance.";
  }
  if (status === 429) {
    return "Limite de requêtes PostHog atteinte. Réessayez dans quelques minutes.";
  }
  if (status === 408 || status === 504) {
    return "Requête PostHog expirée (>10s). Réduisez le volume d'événements ou réessayez plus tard.";
  }

  return `Erreur PostHog (${status})`;
}

async function postHogRequest<T>(
  credential: Pick<PostHogCredential, "personalApiKey" | "appHost">,
  path: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    body?: unknown;
    searchParams?: URLSearchParams;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const base = getAppHost(credential);
  const url = new URL(`${base}${path}`);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${credential.personalApiKey}`,
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
    throw new PostHogConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

const QUERY_POLL_MS = 500;
const QUERY_POLL_MAX_ATTEMPTS = 40;

async function pollQueryResult(
  credential: PostHogCredential,
  queryId: string,
): Promise<HogQLQueryResponse> {
  for (let attempt = 0; attempt < QUERY_POLL_MAX_ATTEMPTS; attempt += 1) {
    const status = await postHogRequest<HogQLQueryResponse>(
      credential,
      `/api/projects/${credential.projectId}/query/${queryId}/`,
    );

    if (!status.query_status || status.query_status.complete !== false) {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, QUERY_POLL_MS));
  }

  throw new PostHogConnectorError(
    "Requête PostHog trop longue. Réessayez ou réduisez la période analysée.",
    408,
  );
}

export async function runProjectQuery<T extends HogQLQueryResponse>(
  credential: PostHogCredential,
  payload: {
    query: Record<string, unknown>;
    name: string;
    refresh?: string;
  },
): Promise<T> {
  const initial = await postHogRequest<T & { query_status?: { id?: string; complete?: boolean } }>(
    credential,
    `/api/projects/${credential.projectId}/query/`,
    {
      method: "POST",
      body: {
        query: payload.query,
        name: payload.name,
        refresh: payload.refresh ?? "blocking",
      },
    },
  );

  if (initial.query_status?.complete === false && initial.query_status.id) {
    return pollQueryResult(credential, initial.query_status.id) as Promise<T>;
  }

  return initial;
}

export async function runHogQLQuery(
  credential: PostHogCredential,
  sql: string,
  name: string,
): Promise<HogQLQueryResponse> {
  return runProjectQuery(credential, {
    name,
    query: {
      kind: "HogQLQuery",
      query: sql,
    },
  });
}

export async function runRetentionQuery(
  credential: PostHogCredential,
  targetEvent: string,
  name = "saas_radar_retention_d7",
): Promise<HogQLQueryResponse> {
  return runProjectQuery(credential, {
    name,
    query: {
      kind: "RetentionQuery",
      retentionFilter: {
        period: "Day",
        totalIntervals: 8,
        targetEntity: {
          id: targetEvent,
          type: "events",
          name: targetEvent,
          order: 0,
        },
        returningEntity: {
          id: "$all_events",
          type: "events",
          name: "All events",
          order: 0,
        },
      },
    },
  });
}

export async function fetchCurrentUser(
  credential: Pick<PostHogCredential, "personalApiKey" | "appHost">,
): Promise<PostHogUserMe> {
  return postHogRequest<PostHogUserMe>(credential, "/api/users/@me/");
}

export async function fetchProjects(
  credential: Pick<PostHogCredential, "personalApiKey" | "appHost">,
): Promise<PostHogProjectSummary[]> {
  const data = await postHogRequest<PostHogPaginated<PostHogProjectRecord> | PostHogProjectRecord[]>(
    credential,
    "/api/projects/",
    { searchParams: new URLSearchParams({ limit: "100" }) },
  );

  const records = Array.isArray(data) ? data : (data.results ?? []);
  return records.map((project) => ({
    id: String(project.id),
    name: project.name?.trim() || `Projet ${project.id}`,
    timezone: project.timezone,
  }));
}

export async function fetchProjectDetails(
  credential: PostHogCredential,
): Promise<PostHogProjectSummary> {
  const project = await postHogRequest<PostHogProjectRecord>(
    credential,
    `/api/projects/${credential.projectId}/`,
  );
  return {
    id: String(project.id),
    name: project.name?.trim() || `Projet ${project.id}`,
    timezone: project.timezone,
  };
}

export async function fetchEventDefinitions(
  credential: PostHogCredential,
): Promise<PostHogEventDefinition[]> {
  const data = await postHogRequest<
    PostHogPaginated<PostHogEventDefinitionRecord> | PostHogEventDefinitionRecord[]
  >(credential, `/api/projects/${credential.projectId}/event_definitions/`, {
    searchParams: new URLSearchParams({ limit: "200", exclude_hidden: "true" }),
  });

  const records = Array.isArray(data) ? data : (data.results ?? []);
  return records
    .map((event) => ({
      name: event.name?.trim() ?? "",
      lastSeenAt: event.last_seen_at ?? null,
    }))
    .filter((event) => event.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAccountMeta(
  credential: PostHogCredential,
  project?: PostHogProjectSummary,
): PostHogAccountMeta {
  const projectName = project?.name ?? `Projet ${credential.projectId}`;
  const hostLabel = getAppHost(credential).replace(/^https?:\/\//, "");
  return {
    accountLabel: `${projectName} (${hostLabel})`,
    projectName,
    timezone: project?.timezone,
    hasSignupEvent: Boolean(credential.signupEvent),
    hasActivationEvent: Boolean(credential.activationEvent),
  };
}

export async function validateCredential(
  credential: PostHogCredential,
): Promise<PostHogAccountMeta> {
  await fetchCurrentUser(credential);

  const projects = await fetchProjects(credential);
  const project = projects.find((item) => item.id === credential.projectId);
  if (!project) {
    throw new PostHogConnectorError(
      "Projet PostHog introuvable ou inaccessible avec cette clé.",
      404,
    );
  }

  await runHogQLQuery(
    credential,
    `SELECT count() AS c FROM events WHERE timestamp >= now() - INTERVAL 7 DAY LIMIT 1`,
    "saas_radar_validate",
  );

  let details = project;
  try {
    details = await fetchProjectDetails(credential);
  } catch {
    // Project details optional
  }

  return buildAccountMeta(credential, details);
}

export function buildMauQuery(start: string, end: string): string {
  return `
    SELECT formatDateTime(toStartOfMonth(timestamp), '%Y-%m') AS month,
           count(DISTINCT person_id) AS mau
    FROM events
    WHERE timestamp >= toDateTime('${start}')
      AND timestamp < toDateTime('${end}') + INTERVAL 1 DAY
      AND person_id IS NOT NULL
    GROUP BY month
    ORDER BY month
  `.trim();
}

export function buildDauQuery(start: string, end: string): string {
  return `
    SELECT month, round(avg(daily_users)) AS dau
    FROM (
      SELECT formatDateTime(toDate(timestamp), '%Y-%m') AS month,
             toDate(timestamp) AS day,
             count(DISTINCT person_id) AS daily_users
      FROM events
      WHERE timestamp >= toDateTime('${start}')
        AND timestamp < toDateTime('${end}') + INTERVAL 1 DAY
        AND person_id IS NOT NULL
      GROUP BY month, day
    )
    GROUP BY month
    ORDER BY month
  `.trim();
}

export function buildSignupsQuery(start: string, end: string, signupEvent: string): string {
  const escaped = escapeHogQLString(signupEvent);
  return `
    SELECT formatDateTime(toStartOfMonth(timestamp), '%Y-%m') AS month,
           count() AS signups
    FROM events
    WHERE event = '${escaped}'
      AND timestamp >= toDateTime('${start}')
      AND timestamp < toDateTime('${end}') + INTERVAL 1 DAY
    GROUP BY month
    ORDER BY month
  `.trim();
}

export function buildFeatureTopQuery(): string {
  return `
    SELECT event, count() AS c
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND event NOT LIKE '$%'
    GROUP BY event
    ORDER BY c DESC
    LIMIT 1
  `.trim();
}

export function buildActivationRateQuery(signupEvent: string, activationEvent: string): string {
  const signup = escapeHogQLString(signupEvent);
  const activation = escapeHogQLString(activationEvent);
  return `
    SELECT count(DISTINCT a.person_id) * 100.0 / greatest(count(DISTINCT s.person_id), 1) AS rate
    FROM (
      SELECT person_id
      FROM events
      WHERE event = '${signup}'
        AND timestamp >= now() - INTERVAL 30 DAY
        AND person_id IS NOT NULL
    ) s
    LEFT JOIN (
      SELECT person_id
      FROM events
      WHERE event = '${activation}'
        AND timestamp >= now() - INTERVAL 30 DAY
        AND person_id IS NOT NULL
    ) a ON s.person_id = a.person_id
  `.trim();
}

export function buildRetentionFallbackQuery(): string {
  return `
    SELECT
      countIf(returned_d7 = 1) * 100.0 / greatest(count(), 1) AS rate
    FROM (
      SELECT
        person_id,
        min(timestamp) AS first_seen,
        countIf(timestamp >= first_seen + INTERVAL 7 DAY AND timestamp < first_seen + INTERVAL 8 DAY) > 0 AS returned_d7
      FROM events
      WHERE timestamp >= now() - INTERVAL 90 DAY
        AND person_id IS NOT NULL
      GROUP BY person_id
    )
  `.trim();
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
