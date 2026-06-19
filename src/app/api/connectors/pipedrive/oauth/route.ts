import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  getPipedriveAuthorizeUrl,
  isPipedriveConfigured,
} from "@/lib/connectors/pipedrive/oauth";

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

  if (!isPipedriveConfigured()) {
    return NextResponse.json(
      {
        error:
          "Pipedrive OAuth non configuré (PIPEDRIVE_CLIENT_ID, PIPEDRIVE_CLIENT_SECRET, PIPEDRIVE_REDIRECT_URI)",
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

  return NextResponse.redirect(getPipedriveAuthorizeUrl(state));
}
