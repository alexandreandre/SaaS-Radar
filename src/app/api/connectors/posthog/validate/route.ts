import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  fetchEventDefinitions,
  fetchCurrentUser,
  fetchProjects,
  parsePostHogCredential,
  parsePostHogKeyInput,
  PostHogConnectorError,
} from "@/lib/connectors/posthog/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const personalApiKey = typeof b.personalApiKey === "string" ? b.personalApiKey.trim() : "";
  const appHost = typeof b.appHost === "string" ? b.appHost.trim() : undefined;
  const posthogProjectId =
    typeof b.posthogProjectId === "string" ? b.posthogProjectId.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!personalApiKey) {
    return NextResponse.json({ error: "personalApiKey requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);

    if (!posthogProjectId) {
      const keyCredential = parsePostHogKeyInput({ personalApiKey, appHost });
      await fetchCurrentUser(keyCredential);
      const projects = await fetchProjects(keyCredential);
      return NextResponse.json({ projects });
    }

    const credential = parsePostHogCredential({
      personalApiKey,
      projectId: posthogProjectId,
      appHost,
    });

    const projects = await fetchProjects(credential);
    const events = await fetchEventDefinitions(credential);
    const selectedProject = projects.find((item) => item.id === credential.projectId);

    return NextResponse.json({
      projects,
      project: selectedProject ?? null,
      events: events.map((event) => ({
        name: event.name,
        lastSeenAt: event.lastSeenAt,
      })),
    });
  } catch (err) {
    const status = err instanceof PostHogConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation PostHog échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
