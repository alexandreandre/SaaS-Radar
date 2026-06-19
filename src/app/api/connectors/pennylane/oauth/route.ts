import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  getPennylaneAuthorizeUrl,
  isPennylaneOAuthConfigured,
} from "@/lib/connectors/pennylane/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  const checkOnly = searchParams.get("check") === "1";

  if (!isPennylaneOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Pennylane OAuth non configuré (PENNYLANE_CLIENT_ID, PENNYLANE_CLIENT_SECRET, PENNYLANE_REDIRECT_URI)",
        configured: false,
      },
      { status: checkOnly ? 200 : 503 },
    );
  }

  if (checkOnly) {
    return NextResponse.json({ configured: true });
  }

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
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

  return NextResponse.redirect(getPennylaneAuthorizeUrl(state));
}
