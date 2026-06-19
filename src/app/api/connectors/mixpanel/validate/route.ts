import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  fetchCurrentUser,
  fetchEventDefinitions,
  MixpanelConnectorError,
  parseMixpanelCredential,
  parseMixpanelKeyInput,
} from "@/lib/connectors/mixpanel/client";

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
  const serviceAccountUsername =
    typeof b.serviceAccountUsername === "string" ? b.serviceAccountUsername.trim() : "";
  const serviceAccountSecret =
    typeof b.serviceAccountSecret === "string" ? b.serviceAccountSecret.trim() : "";
  const region = typeof b.region === "string" ? b.region.trim() : undefined;
  const mixpanelProjectId =
    typeof b.mixpanelProjectId === "string" ? b.mixpanelProjectId.trim() : "";
  const workspaceId = typeof b.workspaceId === "string" ? b.workspaceId.trim() : null;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!serviceAccountUsername || !serviceAccountSecret) {
    return NextResponse.json(
      { error: "serviceAccountUsername et serviceAccountSecret requis" },
      { status: 400 },
    );
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);

    if (!mixpanelProjectId) {
      const keyCredential = parseMixpanelKeyInput({
        serviceAccountUsername,
        serviceAccountSecret,
        region,
      });
      await fetchCurrentUser(keyCredential);
      return NextResponse.json({ ok: true });
    }

    const credential = parseMixpanelCredential({
      serviceAccountUsername,
      serviceAccountSecret,
      projectId: mixpanelProjectId,
      region,
      workspaceId,
      activityEvent: "Signed Up",
    });

    const events = await fetchEventDefinitions(credential);

    return NextResponse.json({
      project: {
        id: credential.projectId,
        region: credential.region,
      },
      events: events.map((event) => ({ name: event.name })),
    });
  } catch (err) {
    const status = err instanceof MixpanelConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Mixpanel échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
