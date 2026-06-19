import type { DevStream } from "@/lib/connectors/streams";
import type { GitHubRepoMetrics, GitHubWorkflowRun } from "@/lib/connectors/github/types";

export function parseRepoFullName(repoFullName: string): { owner: string; repo: string } | null {
  const trimmed = repoFullName.trim();
  if (!trimmed.includes("/")) return null;
  const [owner, repo] = trimmed.split("/");
  if (!owner || !repo) return null;
  return { owner, repo };
}

export function countDeploysLast30d(
  runs: GitHubWorkflowRun[],
  now = new Date(),
): number {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);

  return runs.filter((run) => {
    if (run.conclusion !== "success") return false;
    const created = new Date(run.created_at);
    return created >= cutoff;
  }).length;
}

export function metricsToDevStream(m: GitHubRepoMetrics): DevStream {
  const commitsDelta = m.commitsLast7d - m.commitsPrev7d;
  let healthScore = 70;
  if (m.lastWorkflowConclusion === "success") healthScore += 15;
  if (m.lastWorkflowConclusion === "failure") healthScore -= 25;
  if (m.commitsLast7d > 0) healthScore += 10;
  if (m.commitsLast7d === 0) healthScore -= 20;
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    type: "dev",
    deploysLast30d: m.deploysLast30d,
    openIssues: m.openIssues,
    errorRate: m.lastWorkflowConclusion === "failure" ? 2.5 : 0,
    uptimePct: m.lastWorkflowConclusion === "failure" ? 98 : 99.9,
    commitsLast7d: m.commitsLast7d,
    commitsDelta,
    openPrs: m.openPrs,
    stars: m.stars,
    lastWorkflowConclusion: m.lastWorkflowConclusion,
    viewsLast14d: m.viewsLast14d,
    defaultBranch: m.defaultBranch,
    lastPushAt: m.lastPushAt,
    repoFullName: m.repoFullName,
    healthScore,
  };
}
