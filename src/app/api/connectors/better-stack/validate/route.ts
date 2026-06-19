import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  BetterStackConnectorError,
  listAllMonitors,
  parseBetterStackCredential,
  validateCredential,
} from "@/lib/connectors/better-stack/client";
import { parseBetterStackApiToken } from "@/lib/connectors/better-stack/keys";
import { suggestMonitorByUrl } from "@/lib/connectors/better-stack/streams";
import { loadUserProject } from "@/lib/portfolio-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveProductionUrl(project: Awaited<ReturnType<typeof loadUserProject>>): string | null {
  if (!project) return null;
  const vercelStream = project.connectorStreams?.vercel;
  if (vercelStream?.type === "dev" && vercelStream.deploymentUrl) {
    return vercelStream.deploymentUrl;
  }
  if (project.hostConnection?.productionUrl) {
    return project.hostConnection.productionUrl;
  }
  return null;
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
  const apiToken = typeof b.apiToken === "string" ? b.apiToken.trim() : "";
  const monitorId = typeof b.monitorId === "string" ? b.monitorId.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiToken) {
    return NextResponse.json({ error: "apiToken requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const parsedToken = parseBetterStackApiToken(apiToken);
    const credential = { apiToken: parsedToken, monitorId: monitorId || "0" };

    if (!monitorId) {
      const monitors = await listAllMonitors(credential);
      if (monitors.length === 0) {
        return NextResponse.json(
          {
            error:
              "Aucun monitor Uptime trouvé. Créez un monitor dans Better Stack puis réessayez.",
          },
          { status: 404 },
        );
      }

      const project = await loadUserProject(user.id, projectId);
      const suggestedMonitorId = suggestMonitorByUrl(monitors, resolveProductionUrl(project));

      return NextResponse.json({
        monitors: monitors.map((monitor) => ({
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          status: monitor.status,
          teamName: monitor.teamName,
        })),
        suggestedMonitorId,
      });
    }

    const parsedCredential = parseBetterStackCredential({
      apiToken: parsedToken,
      monitorId,
    });
    const meta = await validateCredential(parsedCredential);

    return NextResponse.json({
      accountLabel: meta.accountLabel,
      monitorStatus: meta.monitorStatus,
      lastCheckedAt: meta.lastCheckedAt,
    });
  } catch (err) {
    const status = err instanceof BetterStackConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Better Stack échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
