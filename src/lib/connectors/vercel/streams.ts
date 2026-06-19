import type { DevStream } from "@/lib/connectors/streams";
import type { VercelDeployMetrics } from "@/lib/connectors/vercel/types";

export function countDeploymentsLast30d(
  deployments: { readyState?: string; state?: string; createdAt: number }[],
  nowMs: number = Date.now(),
): number {
  const since = nowMs - 30 * 24 * 60 * 60 * 1000;
  return deployments.filter((d) => d.createdAt >= since).length;
}

export function computeDeploySuccessRate(
  deployments: { readyState?: string; state?: string; createdAt: number }[],
  nowMs: number = Date.now(),
): number {
  const since = nowMs - 30 * 24 * 60 * 60 * 1000;
  const recent = deployments.filter((d) => d.createdAt >= since);
  if (recent.length === 0) return 99.9;

  const failed = recent.filter(
    (d) => (d.readyState ?? d.state)?.toUpperCase() === "ERROR",
  ).length;
  return Math.round(((recent.length - failed) / recent.length) * 1000) / 10;
}

export function buildDevStreamFromMetrics(metrics: VercelDeployMetrics): DevStream {
  const failed = metrics.lastDeploymentState?.toUpperCase() === "ERROR";
  return {
    type: "dev",
    deploysLast30d: metrics.deploysLast30d,
    openIssues: 0,
    errorRate: failed ? 2 : 0,
    uptimePct: metrics.uptimePct,
    deploymentUrl: metrics.productionUrl || undefined,
    lastDeploymentState: metrics.lastDeploymentState ?? null,
    lastDeploymentAt: metrics.lastDeploymentAt ?? undefined,
    infraCostMonthly:
      metrics.infraCostMonthly > 0 ? metrics.infraCostMonthly : undefined,
  };
}

export function parseBillingChargesJsonl(
  raw: string,
  projectId?: string,
): number {
  let total = 0;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const row = JSON.parse(trimmed) as Record<string, unknown>;
      if (projectId) {
        const rowProject =
          typeof row.ProjectId === "string"
            ? row.ProjectId
            : typeof row.projectId === "string"
              ? row.projectId
              : undefined;
        if (rowProject && rowProject !== projectId) continue;
      }

      const cost =
        typeof row.BilledCost === "number"
          ? row.BilledCost
          : typeof row.billedCost === "number"
            ? row.billedCost
            : typeof row.effectiveCost === "number"
              ? row.effectiveCost
              : typeof row.cost === "number"
                ? row.cost
                : 0;
      total += cost;
    } catch {
      // Ignore malformed JSONL lines
    }
  }

  return Math.round(total * 100) / 100;
}
