import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { isZendeskConfigured, getZendeskAuthorizeUrl } from "@/lib/connectors/zendesk/oauth";
import { normalizeSubdomain } from "@/lib/connectors/zendesk/snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  const subdomainRaw = searchParams.get("subdomain")?.trim() ?? "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  const subdomain = normalizeSubdomain(subdomainRaw);
  if (!subdomain) {
    return NextResponse.json(
      { error: "Subdomain Zendesk invalide (ex. acme pour acme.zendesk.com)" },
      { status: 400 },
    );
  }

  if (!isZendeskConfigured()) {
    return NextResponse.json(
      {
        error:
          "Zendesk OAuth non configuré (ZENDESK_CLIENT_ID, ZENDESK_CLIENT_SECRET, ZENDESK_REDIRECT_URI)",
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Accès refusé" },
      { status: 403 },
    );
  }

  const state = Buffer.from(
    JSON.stringify({ projectId, userId: user.id, subdomain }),
  ).toString("base64url");

  return NextResponse.redirect(getZendeskAuthorizeUrl(subdomain, state));
}
