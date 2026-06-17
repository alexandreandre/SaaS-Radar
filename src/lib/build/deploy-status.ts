import type { DevStream } from "@/lib/connectors/streams";
import type { UserProject } from "@/lib/portfolio";

export type UnifiedDeployStatus = {
  status: "success" | "failure" | "pending" | "unknown";
  label: string;
  detail?: string;
  url?: string;
  sources: ("github" | "vercel" | "host")[];
};

function mapWorkflowConclusion(
  conclusion: string | null | undefined,
): UnifiedDeployStatus["status"] {
  if (conclusion === "success") return "success";
  if (conclusion === "failure") return "failure";
  if (conclusion === "in_progress" || conclusion === "queued") return "pending";
  return "unknown";
}

function mapVercelState(state?: string | null): UnifiedDeployStatus["status"] {
  if (!state) return "unknown";
  const upper = state.toUpperCase();
  if (upper === "READY" || upper === "SUCCESS") return "success";
  if (upper === "ERROR" || upper === "CANCELED" || upper === "FAILED") return "failure";
  if (upper === "BUILDING" || upper === "QUEUED" || upper === "INITIALIZING") return "pending";
  return "unknown";
}

export function getUnifiedDeployStatus(project: UserProject): UnifiedDeployStatus | null {
  const github = project.connectorStreams?.github as DevStream | undefined;
  const vercel = project.connectorStreams?.vercel as DevStream | undefined;
  const hostUrl = project.hostConnection?.productionUrl;

  const sources: ("github" | "vercel" | "host")[] = [];
  let status: UnifiedDeployStatus["status"] = "unknown";
  let label = "Statut de déploiement";
  let detail: string | undefined;
  let url = hostUrl;

  if (vercel?.type === "dev") {
    sources.push("vercel");
    const vercelStatus = mapVercelState(vercel.lastDeploymentState);
    if (vercelStatus !== "unknown") status = vercelStatus;
    if (vercel.deploymentUrl) url = vercel.deploymentUrl;
    if (vercel.lastDeploymentState) {
      detail = `Vercel : ${vercel.lastDeploymentState}`;
    }
  }

  if (github?.type === "dev" && github.lastWorkflowConclusion) {
    sources.push("github");
    const ghStatus = mapWorkflowConclusion(github.lastWorkflowConclusion);
    if (status === "unknown" || ghStatus === "failure") status = ghStatus;
    if (!detail) detail = `CI GitHub : ${github.lastWorkflowConclusion}`;
  }

  if (hostUrl) {
    sources.push("host");
    if (status === "unknown") status = "success";
    label = "Production en ligne";
    if (!detail) detail = "URL de production enregistrée";
  }

  if (sources.length === 0) return null;

  if (status === "success") label = "Déploiement OK";
  if (status === "failure") label = "Déploiement en échec";
  if (status === "pending") label = "Déploiement en cours";

  return { status, label, detail, url, sources };
}
