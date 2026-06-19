import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  fetchSiteGoals,
  parsePlausibleCredential,
  PlausibleConnectorError,
  validateCredential,
} from "@/lib/connectors/plausible/client";

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
  const siteId = typeof b.siteId === "string" ? b.siteId.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiKey || !siteId) {
    return NextResponse.json({ error: "apiKey et siteId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parsePlausibleCredential({ apiKey, siteId });
    const meta = await validateCredential(credential);

    let goals: { id: string; displayName: string; goalType: string }[] = [];
    try {
      const goalsRes = await fetchSiteGoals(credential);
      goals = (goalsRes.goals ?? []).map((goal) => ({
        id: goal.id,
        displayName: goal.display_name,
        goalType: goal.goal_type,
      }));
    } catch {
      // Goals listing optional — user can skip signups
    }

    return NextResponse.json({
      accountLabel: meta.accountLabel,
      timezone: meta.timezone,
      goals,
    });
  } catch (err) {
    const status = err instanceof PlausibleConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Plausible échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
