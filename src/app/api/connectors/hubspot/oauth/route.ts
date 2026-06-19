import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { getHubSpotAuthorizeUrl, isHubSpotConfigured } from "@/lib/connectors/hubspot/oauth";

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

  if (!isHubSpotConfigured()) {
    return NextResponse.json(
      {
        error:
          "HubSpot OAuth non configuré (HUBSPOT_CLIENT_ID, HUBSPOT_CLIENT_SECRET, HUBSPOT_REDIRECT_URI ou NEXT_PUBLIC_APP_URL)",
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

  const state = Buffer.from(JSON.stringify({ projectId, userId: user.id })).toString(
    "base64url",
  );

  return NextResponse.redirect(getHubSpotAuthorizeUrl(state));
}
