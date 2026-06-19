import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  CrispConnectorError,
  isCrispPluginConfigured,
  parseCrispCredential,
  validateWebsiteAccess,
} from "@/lib/connectors/crisp/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isCrispPluginConfigured()) {
    return NextResponse.json(
      { error: "Connecteur Crisp non configuré (CRISP_PLUGIN_IDENTIFIER / CRISP_PLUGIN_KEY)" },
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
  const websiteId = typeof b.websiteId === "string" ? b.websiteId.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!websiteId) {
    return NextResponse.json({ error: "websiteId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parseCrispCredential({ websiteId });
    const meta = await validateWebsiteAccess(credential);

    return NextResponse.json({
      accountLabel: meta.accountLabel,
      websiteName: meta.websiteName,
      domain: meta.domain,
      timezone: meta.timezone,
    });
  } catch (err) {
    const status = err instanceof CrispConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Crisp échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
