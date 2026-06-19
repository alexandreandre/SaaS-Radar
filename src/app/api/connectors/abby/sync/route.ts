import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { AbbyConnectorError } from "@/lib/connectors/abby/client";
import { runAbbySync } from "@/lib/connectors/abby/sync-service";

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

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const sync = await runAbbySync(user.id, projectId);

    return NextResponse.json({
      accountLabel: sync.accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
      revenueSource: sync.revenueSource,
      revenueUnavailable: sync.revenueUnavailable ?? false,
    });
  } catch (err) {
    const status = err instanceof AbbyConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Synchronisation Abby échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
