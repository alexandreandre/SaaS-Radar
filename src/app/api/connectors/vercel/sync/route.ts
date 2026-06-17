import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { DevStream } from "@/lib/connectors/streams";
import type { HostConnection } from "@/lib/portfolio";
import { loadConnectorCredential } from "@/lib/connectors/credentials-store";
import {
  fetchVercelDeployMetrics,
  listVercelProjects,
} from "@/lib/vercel/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function metricsToDevStream(m: Awaited<ReturnType<typeof fetchVercelDeployMetrics>>): DevStream {
  const failed = m?.lastDeploymentState?.toUpperCase() === "ERROR";
  return {
    type: "dev",
    deploysLast30d: m?.deploysLast30d ?? 0,
    openIssues: 0,
    errorRate: failed ? 2 : 0,
    uptimePct: m?.uptimePct ?? 99.9,
    deploymentUrl: m?.productionUrl,
    lastDeploymentState: m?.lastDeploymentState ?? null,
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const action = b.action === "list_projects" ? "list_projects" : "sync";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  const cred = await loadConnectorCredential<{
    accessToken: string;
    teamId?: string | null;
  }>(user.id, projectId, "vercel");

  if (!cred?.data.accessToken) {
    return NextResponse.json({ error: "Vercel non connecté" }, { status: 404 });
  }

  const { accessToken, teamId } = cred.data;
  const team = teamId ?? undefined;

  try {
    if (action === "list_projects") {
      const projects = await listVercelProjects(accessToken, team);
      return NextResponse.json({
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          repo: p.link?.repo,
        })),
      });
    }

    const targetProjectId =
      typeof b.vercelProjectId === "string" ? b.vercelProjectId.trim() : "";
    if (!targetProjectId) {
      return NextResponse.json({ error: "vercelProjectId requis" }, { status: 400 });
    }

    const metrics = await fetchVercelDeployMetrics(accessToken, targetProjectId, team);
    if (!metrics) {
      return NextResponse.json({ error: "Projet Vercel introuvable" }, { status: 404 });
    }

    const stream = metricsToDevStream(metrics);
    const connection: HostConnection = {
      provider: "vercel",
      projectId: metrics.projectId,
      projectName: metrics.projectName,
      productionUrl: metrics.productionUrl || undefined,
      connectedAt: new Date().toISOString(),
    };

    return NextResponse.json({ connection, stream, metrics });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Vercel" },
      { status: 500 },
    );
  }
}
