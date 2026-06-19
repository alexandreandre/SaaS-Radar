import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  getLoopsWebhookUrl,
  listMailingLists,
  LoopsConnectorError,
  validateApiKey,
} from "@/lib/connectors/loops/client";
import { parseLoopsApiKey } from "@/lib/connectors/loops/keys";

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
  const apiKey = typeof b.apiKey === "string" ? b.apiKey.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "apiKey requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const apiKeyParsed = parseLoopsApiKey(apiKey);
    const { teamName } = await validateApiKey({ apiKey: apiKeyParsed });

    let mailingLists: { id: string; name: string; description: string; isPublic: boolean }[] = [];
    try {
      mailingLists = await listMailingLists({ apiKey: apiKeyParsed });
    } catch {
      // Optional — user can skip conversion list
    }

    return NextResponse.json({
      teamName,
      accountLabel: teamName,
      mailingLists,
      webhookUrl: getLoopsWebhookUrl(projectId),
    });
  } catch (err) {
    const status = err instanceof LoopsConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Loops échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
