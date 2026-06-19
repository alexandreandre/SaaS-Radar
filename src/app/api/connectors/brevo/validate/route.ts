import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  BrevoConnectorError,
  generateWebhookToken,
  getBrevoWebhookUrl,
  listContactLists,
  parseBrevoCredential,
  validateApiKey,
} from "@/lib/connectors/brevo/client";

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
    const credential = parseBrevoCredential({ apiKey, webhookToken: generateWebhookToken() });
    const { companyName, accountEmail } = await validateApiKey(credential);

    let lists: { id: string; name: string }[] = [];
    try {
      const rawLists = await listContactLists(credential);
      lists = rawLists.map((list) => ({
        id: String(list.id),
        name: list.name,
      }));
    } catch {
      // Lists optional for campaign_clicks mode
    }

    const webhookToken = credential.webhookToken;
    const webhookUrl = getBrevoWebhookUrl(projectId, webhookToken);

    return NextResponse.json({
      accountLabel: companyName,
      companyName,
      accountEmail,
      lists,
      webhookUrl,
      webhookToken,
    });
  } catch (err) {
    const status = err instanceof BrevoConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Brevo échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
