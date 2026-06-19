import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { SlackConnectorError } from "@/lib/connectors/slack/client";
import { listSlackChannels } from "@/lib/connectors/slack/sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const channels = await listSlackChannels(user.id, projectId);
    return NextResponse.json({ channels });
  } catch (err) {
    const status = err instanceof SlackConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur Slack";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
