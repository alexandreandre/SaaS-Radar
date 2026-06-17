import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getVercelAuthorizeUrl, isVercelOAuthConfigured } from "@/lib/vercel/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  if (!isVercelOAuthConfigured()) {
    return NextResponse.json(
      { error: "OAuth Vercel non configuré", configured: false },
      { status: 503 },
    );
  }

  const state = Buffer.from(JSON.stringify({ projectId, userId: user.id })).toString(
    "base64url",
  );
  const url = getVercelAuthorizeUrl(state);
  if (!url) {
    return NextResponse.json({ error: "VERCEL_CLIENT_ID manquant" }, { status: 503 });
  }

  return NextResponse.redirect(url);
}
