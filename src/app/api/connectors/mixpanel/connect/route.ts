import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  MixpanelConnectorError,
  parseMixpanelCredential,
} from "@/lib/connectors/mixpanel/client";
import { runMixpanelSync, saveMixpanelCredential } from "@/lib/connectors/mixpanel/sync-service";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isCredentialsEncryptionConfigured()) {
    return NextResponse.json(
      { error: "Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY)" },
      { status: 503 },
    );
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
  const mixpanelProjectId =
    typeof b.mixpanelProjectId === "string" ? b.mixpanelProjectId.trim() : "";
  const region = typeof b.region === "string" ? b.region.trim() : undefined;
  const workspaceId = typeof b.workspaceId === "string" ? b.workspaceId.trim() : null;
  const projectLabel = typeof b.projectLabel === "string" ? b.projectLabel.trim() : null;
  const signupEvent = typeof b.signupEvent === "string" ? b.signupEvent.trim() : null;
  const activationEvent =
    typeof b.activationEvent === "string" ? b.activationEvent.trim() : null;
  const activityEvent = typeof b.activityEvent === "string" ? b.activityEvent.trim() : null;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!serviceAccountUsername || !serviceAccountSecret || !mixpanelProjectId) {
    return NextResponse.json(
      {
        error:
          "serviceAccountUsername, serviceAccountSecret et mixpanelProjectId requis",
      },
      { status: 400 },
    );
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parseMixpanelCredential({
      serviceAccountUsername,
      serviceAccountSecret,
      projectId: mixpanelProjectId,
      region,
      workspaceId,
      projectLabel,
      signupEvent: signupEvent || null,
      activationEvent: activationEvent || null,
      activityEvent: activityEvent || null,
    });
    const { accountLabel } = await saveMixpanelCredential(user.id, projectId, credential);
    const sync = await runMixpanelSync(user.id, projectId);

    return NextResponse.json({
      accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof MixpanelConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Mixpanel";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
