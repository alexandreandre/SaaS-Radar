import type { DevStream } from "@/lib/connectors/streams";
import type { SentryRelease, SentrySyncMetrics } from "@/lib/connectors/sentry/types";

export function computeErrorRateFromCounts(errorCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((errorCount / totalCount) * 1000) / 10;
}

export function crashFreeRateToUptimePct(crashFreeRate: number | null | undefined): number {
  if (crashFreeRate == null || Number.isNaN(crashFreeRate)) return 0;
  const pct = crashFreeRate <= 1 ? crashFreeRate * 100 : crashFreeRate;
  return Math.round(Math.min(100, Math.max(0, pct)) * 10) / 10;
}

export function countReleasesLast30d(
  releases: SentryRelease[],
  nowMs: number = Date.now(),
): number {
  const since = nowMs - 30 * 24 * 60 * 60 * 1000;
  return releases.filter((release) => {
    if (!release.dateCreated) return false;
    const created = new Date(release.dateCreated).getTime();
    return !Number.isNaN(created) && created >= since;
  }).length;
}

export function parseCountUniqueIssueFromEvents(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as { data?: Array<Record<string, unknown>> };
  const row = payload.data?.[0];
  if (!row) return 0;

  for (const [key, value] of Object.entries(row)) {
    if (key.includes("count_unique") && typeof value === "number") {
      return value;
    }
    if (key.includes("count_unique") && typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return null;
}

export function parseSessionMetricFromResponse(
  data: unknown,
  metricFragment: string,
): number | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as {
    groups?: Array<{ totals?: Record<string, number | string> }>;
  };

  for (const group of payload.groups ?? []) {
    const totals = group.totals ?? {};
    for (const [key, value] of Object.entries(totals)) {
      if (!key.includes(metricFragment)) continue;
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
  }

  return null;
}

export function parseCrashFreeRateFromSessions(data: unknown): number | null {
  return parseSessionMetricFromResponse(data, "crash_free_rate");
}

export function parseCrashRateFromSessions(data: unknown): number | null {
  return parseSessionMetricFromResponse(data, "crash_rate");
}

export function sumEventStatsSeries(data: unknown): number {
  if (!Array.isArray(data)) return 0;
  let total = 0;
  for (const point of data) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const bucket = point[1];
    if (Array.isArray(bucket)) {
      for (const item of bucket) {
        if (item && typeof item === "object" && "count" in item) {
          const count = (item as { count?: number }).count;
          if (typeof count === "number") total += count;
        }
      }
    } else if (typeof bucket === "number") {
      total += bucket;
    }
  }
  return total;
}

export function buildDevStreamFromMetrics(metrics: SentrySyncMetrics): DevStream {
  return {
    type: "dev",
    deploysLast30d: metrics.deploysLast30d,
    openIssues: metrics.openIssues,
    errorRate: metrics.errorRate,
    uptimePct: metrics.uptimePct,
  };
}

export function buildAccountLabel(
  organizationSlug: string,
  projectName?: string,
  projectSlug?: string,
): string {
  const project = projectName?.trim() || projectSlug?.trim();
  if (project) return `Sentry · ${project}`;
  return `Sentry · ${organizationSlug}`;
}
