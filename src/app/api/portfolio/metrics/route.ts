import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncProjectMetrics, type SyncProjectMetricsInput } from "@/lib/portfolio-sync";
import type { ProjectPhase } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PHASES: ProjectPhase[] = ["build", "launch", "revenue", "paused"];

function parseBody(body: unknown): SyncProjectMetricsInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const opportunitySlug = typeof b.opportunitySlug === "string" ? b.opportunitySlug.trim() : "";
  const phase = typeof b.phase === "string" ? b.phase : "";
  const currentMrr = typeof b.currentMrr === "number" ? b.currentMrr : Number(b.currentMrr);

  if (!projectId || !opportunitySlug || !VALID_PHASES.includes(phase as ProjectPhase)) {
    return null;
  }
  if (!Number.isFinite(currentMrr) || currentMrr < 0) return null;

  return {
    projectId,
    opportunitySlug,
    phase: phase as ProjectPhase,
    currentMrr,
    metricsHistory: Array.isArray(b.metricsHistory) ? b.metricsHistory : [],
    mrrHistory: Array.isArray(b.mrrHistory) ? b.mrrHistory : [],
    lastCheckInAt: typeof b.lastCheckInAt === "string" ? b.lastCheckInAt : undefined,
    checkInStreak: typeof b.checkInStreak === "number" ? b.checkInStreak : undefined,
  };
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const input = parseBody(body);
  if (!input) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    await syncProjectMetrics(user.id, input);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
