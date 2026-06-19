import "server-only";

import { buildDateRangeLast30Days } from "@/lib/connectors/better-stack/streams";
import type {
  BetterStackCredential,
  BetterStackIncidentsListResponse,
  BetterStackMonitorResponse,
  BetterStackMonitorSummary,
  BetterStackMonitorsListResponse,
  BetterStackResponseTimesResponse,
  BetterStackSlaResponse,
  BetterStackUptimeMetrics,
} from "@/lib/connectors/better-stack/types";

export { parseBetterStackCredential } from "@/lib/connectors/better-stack/keys";

const DEFAULT_API_BASE = "https://uptime.betterstack.com";

export class BetterStackConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BetterStackConnectorError";
    this.status = status;
  }
}

function getApiBase(): string {
  const fromEnv = process.env.BETTER_STACK_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_API_BASE;
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.errors === "string" && record.errors.trim()) {
      return record.errors;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
  }

  if (status === 401) {
    return "Token Better Stack invalide ou révoqué.";
  }
  if (status === 403) {
    return "Ce token n'a pas accès aux ressources Uptime Better Stack.";
  }
  if (status === 404) {
    return "Monitor Better Stack introuvable. Vérifiez l'ID du monitor.";
  }
  if (status === 429) {
    return "Limite de requêtes Better Stack atteinte. Réessayez dans quelques minutes.";
  }

  return `Erreur Better Stack (${status})`;
}

export async function betterStackRequest<T>(
  credential: Pick<BetterStackCredential, "apiToken">,
  path: string,
  options: {
    searchParams?: URLSearchParams;
  } = {},
): Promise<T> {
  const url = new URL(`${getApiBase()}${path}`);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${credential.apiToken}`,
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
    throw new BetterStackConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

function mapMonitorSummary(resource: BetterStackMonitorsListResponse["data"][number]): BetterStackMonitorSummary {
  const attrs = resource.attributes ?? {};
  return {
    id: resource.id,
    name: attrs.pronounceable_name?.trim() || attrs.url?.trim() || `Monitor ${resource.id}`,
    url: attrs.url?.trim() || null,
    status: attrs.status?.trim() || "unknown",
    teamName: attrs.team_name?.trim() || null,
    lastCheckedAt: attrs.last_checked_at ?? null,
  };
}

export async function listAllMonitors(
  credential: Pick<BetterStackCredential, "apiToken">,
): Promise<BetterStackMonitorSummary[]> {
  const monitors: BetterStackMonitorSummary[] = [];

  for (let page = 1; page <= 20; page++) {
    const params = new URLSearchParams({
      per_page: "250",
      page: String(page),
    });

    const response = await betterStackRequest<BetterStackMonitorsListResponse>(
      credential,
      "/api/v2/monitors",
      { searchParams: params },
    );

    for (const item of response.data ?? []) {
      monitors.push(mapMonitorSummary(item));
    }

    if (!response.pagination?.next) break;
  }

  return monitors;
}

export async function fetchMonitor(
  credential: BetterStackCredential,
): Promise<BetterStackMonitorSummary> {
  const response = await betterStackRequest<BetterStackMonitorResponse>(
    credential,
    `/api/v2/monitors/${credential.monitorId}`,
  );

  return mapMonitorSummary(response.data);
}

export async function fetchMonitorSla(
  credential: BetterStackCredential,
  now: Date = new Date(),
): Promise<BetterStackUptimeMetrics["sla"]> {
  const [from, to] = buildDateRangeLast30Days(now);
  const params = new URLSearchParams({ from, to });

  try {
    const response = await betterStackRequest<BetterStackSlaResponse>(
      credential,
      `/api/v2/monitors/${credential.monitorId}/sla`,
      { searchParams: params },
    );

    const attrs = response.data.attributes ?? {};
    return {
      availability: typeof attrs.availability === "number" ? attrs.availability : 99.9,
      totalDowntime: typeof attrs.total_downtime === "number" ? attrs.total_downtime : 0,
      numberOfIncidents:
        typeof attrs.number_of_incidents === "number" ? attrs.number_of_incidents : 0,
      longestIncident: typeof attrs.longest_incident === "number" ? attrs.longest_incident : 0,
      averageIncident: typeof attrs.average_incident === "number" ? attrs.average_incident : 0,
    };
  } catch (err) {
    if (err instanceof BetterStackConnectorError && err.status === 400) {
      return null;
    }
    throw err;
  }
}

export async function countOpenIncidents(
  credential: BetterStackCredential,
): Promise<number> {
  let total = 0;

  for (let page = 1; page <= 20; page++) {
    const params = new URLSearchParams({
      monitor_id: credential.monitorId,
      resolved: "false",
      per_page: "50",
      page: String(page),
    });

    const response = await betterStackRequest<BetterStackIncidentsListResponse>(
      credential,
      "/api/v3/incidents",
      { searchParams: params },
    );

    total += response.data?.length ?? 0;
    if (!response.pagination?.next) break;
  }

  return total;
}

export async function fetchAverageResponseTimeMs(
  credential: BetterStackCredential,
): Promise<number | null> {
  try {
    const response = await betterStackRequest<BetterStackResponseTimesResponse>(
      credential,
      `/api/v2/monitors/${credential.monitorId}/response-times`,
    );

    const regions = response.data.attributes.regions ?? [];
    const samples: number[] = [];

    for (const region of regions) {
      for (const entry of region.response_times ?? []) {
        if (typeof entry.response_time === "number" && entry.response_time > 0) {
          samples.push(entry.response_time * 1000);
        }
      }
    }

    if (samples.length === 0) return null;
    const sum = samples.reduce((acc, value) => acc + value, 0);
    return Math.round((sum / samples.length) * 10) / 10;
  } catch {
    return null;
  }
}

export async function fetchUptimeMetrics(
  credential: BetterStackCredential,
): Promise<BetterStackUptimeMetrics> {
  const [monitor, sla, openIncidents, avgResponseTimeMs] = await Promise.all([
    fetchMonitor(credential),
    fetchMonitorSla(credential),
    countOpenIncidents(credential),
    fetchAverageResponseTimeMs(credential),
  ]);

  return {
    monitorId: monitor.id,
    monitorName: monitor.name,
    monitorUrl: monitor.url,
    monitorStatus: monitor.status,
    lastCheckedAt: monitor.lastCheckedAt,
    sla,
    openIncidents,
    avgResponseTimeMs,
  };
}

export async function validateCredential(
  credential: BetterStackCredential,
): Promise<{ accountLabel: string; monitorStatus: string; lastCheckedAt: string | null }> {
  const monitor = await fetchMonitor(credential);
  return {
    accountLabel: monitor.name,
    monitorStatus: monitor.status,
    lastCheckedAt: monitor.lastCheckedAt,
  };
}
