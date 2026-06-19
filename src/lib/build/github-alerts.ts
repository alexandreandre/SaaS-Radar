import {
  getGitHubReposForTool,
  getPrimaryGitHubRepo,
  hasGitHubTrackedRepos,
  resolveGitHubTrackedRepos,
} from "@/lib/connectors/github/normalize";
import type { ConnectorStreamPayload, DevStream } from "@/lib/connectors/streams";
import { getGitHubRepoStream } from "@/lib/connectors/streams";
import { getActiveBuildToolId, type UserProject } from "@/lib/portfolio";

export type BuildGitHubAlert = {
  severity: "info" | "warning" | "critical";
  message: string;
};

function alertFromStream(stream: DevStream, repoFullName?: string): BuildGitHubAlert | null {
  const prefix = repoFullName ? `${repoFullName} : ` : "";

  if (stream.lastWorkflowConclusion === "failure") {
    return {
      severity: "critical",
      message: `${prefix}Dernier déploiement CI en échec — corrigez avant de continuer.`,
    };
  }

  if ((stream.commitsLast7d ?? 0) === 0) {
    return {
      severity: "warning",
      message: `${prefix}Aucun commit cette semaine — votre build stagne.`,
    };
  }

  if ((stream.commitsDelta ?? 0) > 0) {
    return {
      severity: "info",
      message: `${prefix}Momentum positif : +${stream.commitsDelta} commits vs la semaine dernière.`,
    };
  }

  return null;
}

function orderedReposForAlert(project: UserProject): string[] {
  const tracked = resolveGitHubTrackedRepos(project);
  const primary = getPrimaryGitHubRepo(project);
  const activeToolId = getActiveBuildToolId(project);
  const linked = getGitHubReposForTool(project, activeToolId);
  const ordered: string[] = [];

  if (primary) ordered.push(primary.repoFullName);
  for (const repo of linked) {
    if (!ordered.includes(repo.repoFullName)) ordered.push(repo.repoFullName);
  }
  for (const repo of tracked) {
    if (!ordered.includes(repo.repoFullName)) ordered.push(repo.repoFullName);
  }
  return ordered;
}

function worstCiStream(
  stream: ConnectorStreamPayload | undefined,
  repoNames: string[],
): { repoFullName: string; devStream: DevStream } | null {
  let worst: { repoFullName: string; devStream: DevStream; rank: number } | null = null;

  for (const repoFullName of repoNames) {
    const devStream = getGitHubRepoStream(stream, repoFullName);
    if (!devStream) continue;
    const conclusion = devStream.lastWorkflowConclusion;
    const rank =
      conclusion === "failure" ? 3 : conclusion === "in_progress" || conclusion === "queued" ? 2 : 1;
    if (!worst || rank > worst.rank) {
      worst = { repoFullName, devStream, rank };
    }
  }

  return worst ? { repoFullName: worst.repoFullName, devStream: worst.devStream } : null;
}

export function getBuildGitHubAlert(
  project: UserProject,
  stream?: ConnectorStreamPayload,
): BuildGitHubAlert | null {
  if (!hasGitHubTrackedRepos(project)) return null;
  if (!stream) {
    return {
      severity: "info",
      message: "Connectez votre repo GitHub pour activer le suivi de build.",
    };
  }

  const ordered = orderedReposForAlert(project);

  for (const repoFullName of ordered) {
    const repoStream = getGitHubRepoStream(stream, repoFullName);
    if (!repoStream) continue;
    const alert = alertFromStream(repoStream, ordered.length > 1 ? repoFullName : undefined);
    if (alert && alert.severity !== "info") return alert;
  }

  const worst = worstCiStream(stream, ordered);
  if (worst) {
    const alert = alertFromStream(
      worst.devStream,
      ordered.length > 1 ? worst.repoFullName : undefined,
    );
    if (alert) return alert;
  }

  for (const repoFullName of ordered) {
    const repoStream = getGitHubRepoStream(stream, repoFullName);
    if (!repoStream) continue;
    const alert = alertFromStream(repoStream, ordered.length > 1 ? repoFullName : undefined);
    if (alert) return alert;
  }

  return null;
}
