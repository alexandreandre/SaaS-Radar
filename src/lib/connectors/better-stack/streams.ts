import type { DevStream } from "@/lib/connectors/streams";
import type {
  BetterStackMonitorSummary,
  BetterStackUptimeMetrics,
} from "@/lib/connectors/better-stack/types";

export function buildDateRangeLast30Days(now: Date = new Date()): [string, string] {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);

  const format = (date: Date) => date.toISOString().slice(0, 10);
  return [format(start), format(end)];
}

export function normalizeHostname(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(url.includes("://") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      ?.toLowerCase() ?? null;
  }
}

export function suggestMonitorByUrl(
  monitors: BetterStackMonitorSummary[],
  productionUrl: string | null | undefined,
): string | null {
  const targetHost = normalizeHostname(productionUrl);
  if (!targetHost || monitors.length === 0) return null;

  let bestId: string | null = null;
  let bestScore = 0;

  for (const monitor of monitors) {
    const monitorHost = normalizeHostname(monitor.url);
    if (!monitorHost) continue;

    let score = 0;
    if (monitorHost === targetHost) {
      score = 100;
    } else if (monitorHost.endsWith(`.${targetHost}`) || targetHost.endsWith(`.${monitorHost}`)) {
      score = 80;
    } else if (monitorHost.includes(targetHost) || targetHost.includes(monitorHost)) {
      score = 50;
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = monitor.id;
    }
  }

  return bestScore >= 50 ? bestId : null;
}

export function computeHealthScore(metrics: Pick<
  BetterStackUptimeMetrics,
  "sla" | "monitorStatus" | "avgResponseTimeMs" | "openIncidents"
>): number {
  const availability = metrics.sla?.availability ?? 99.9;
  let score = Math.min(100, Math.max(0, availability));

  if (metrics.monitorStatus === "down") {
    score = Math.min(score, 40);
  } else if (metrics.monitorStatus === "validating") {
    score = Math.min(score, 70);
  } else if (metrics.monitorStatus === "paused" || metrics.monitorStatus === "maintenance") {
    score = Math.min(score, 60);
  }

  if (metrics.openIncidents > 0) {
    score = Math.max(0, score - Math.min(20, metrics.openIncidents * 5));
  }

  if (metrics.avgResponseTimeMs != null && metrics.avgResponseTimeMs > 2000) {
    score = Math.max(0, score - 10);
  }

  return Math.round(score * 10) / 10;
}

export function buildDevStreamFromUptimeMetrics(metrics: BetterStackUptimeMetrics): DevStream {
  const uptimePct =
    metrics.sla?.availability != null
      ? Math.round(metrics.sla.availability * 10) / 10
      : 99.9;
  const errorRate = Math.round((100 - uptimePct) * 10) / 10;

  return {
    type: "dev",
    deploysLast30d: 0,
    openIssues: metrics.openIncidents,
    errorRate,
    uptimePct,
    deploymentUrl: metrics.monitorUrl ?? undefined,
    lastDeploymentAt: metrics.lastCheckedAt ?? undefined,
    healthScore: computeHealthScore(metrics),
  };
}
