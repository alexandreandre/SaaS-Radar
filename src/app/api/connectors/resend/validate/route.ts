import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  getResendWebhookUrl,
  listDomains,
  listSegments,
  ResendConnectorError,
  validateApiKey,
} from "@/lib/connectors/resend/client";
import { parseResendApiKey } from "@/lib/connectors/resend/keys";

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
    const parsedKey = parseResendApiKey(apiKey);
    const credential = { apiKey: parsedKey };

    const { accountLabel } = await validateApiKey(credential);

    let segments: { id: string; name: string }[] = [];
    try {
      const rawSegments = await listSegments(credential);
      segments = rawSegments.map((segment) => ({
        id: segment.id,
        name: segment.name,
      }));
    } catch {
      // Segments optional for email_clicked mode
    }

    let domains: { id: string; name: string; status: string }[] = [];
    try {
      const rawDomains = await listDomains(credential);
      domains = rawDomains.map((domain) => ({
        id: domain.id,
        name: domain.name,
        status: domain.status,
      }));
    } catch {
      // Domains already validated via validateApiKey
    }

    const webhookUrl = getResendWebhookUrl(projectId);

    return NextResponse.json({
      accountLabel,
      domains,
      segments,
      webhookUrl,
    });
  } catch (err) {
    const status = err instanceof ResendConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Resend échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
