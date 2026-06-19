import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { isVercelConfigured } from "@/lib/connectors/vercel/oauth";
import { getVercelConnectorStatus } from "@/lib/connectors/vercel/sync-service";

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

  try {
    await assertProjectOwnedByUser(user.id, projectId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Accès refusé" },
      { status: 403 },
    );
  }

  if (!isVercelConfigured()) {
    return NextResponse.json({
      platformConfigured: false,
      oauthConnected: false,
      vercelProjectId: null,
      accountLabel: null,
      billingAvailable: false,
    });
  }

  const status = await getVercelConnectorStatus(user.id, projectId);
  return NextResponse.json(status);
}
