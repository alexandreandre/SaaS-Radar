import type { DevStream } from "@/lib/connectors/streams";
import type { UserProject } from "@/lib/portfolio";

export type BuildGitHubAlert = {
  severity: "info" | "warning" | "critical";
  message: string;
};

export function getBuildGitHubAlert(
  project: UserProject,
  stream?: DevStream,
): BuildGitHubAlert | null {
  if (!project.githubConnection) return null;
  if (!stream || stream.type !== "dev") {
    return {
      severity: "info",
      message: "Connectez votre repo GitHub pour activer le suivi de build.",
    };
  }

  if (stream.lastWorkflowConclusion === "failure") {
    return {
      severity: "critical",
      message: "Dernier déploiement CI en échec — corrigez avant de continuer.",
    };
  }

  if ((stream.commitsLast7d ?? 0) === 0) {
    return {
      severity: "warning",
      message: "Aucun commit cette semaine — votre build stagne.",
    };
  }

  if ((stream.commitsDelta ?? 0) > 0) {
    return {
      severity: "info",
      message: `Momentum positif : +${stream.commitsDelta} commits vs la semaine dernière.`,
    };
  }

  return null;
}
