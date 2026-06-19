import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { getVercelAuthorizeUrl, isVercelConfigured } from "@/lib/connectors/vercel/oauth";
import type { VercelOAuthState } from "@/lib/connectors/vercel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  const returnTo = searchParams.get("returnTo") === "integrations" ? "integrations" : "build";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  if (!isVercelConfigured()) {
    return NextResponse.json(
      {
        error:
          "OAuth Vercel non configuré (VERCEL_CLIENT_ID, VERCEL_CLIENT_SECRET et NEXT_PUBLIC_APP_URL)",
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

  const state: VercelOAuthState = { projectId, userId: user.id, returnTo };
  const stateEncoded = Buffer.from(JSON.stringify(state)).toString("base64url");
  const url = getVercelAuthorizeUrl(stateEncoded);

  return NextResponse.redirect(url);
}
