import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncUserProject } from "@/lib/portfolio-sync";
import type { ProjectPhase, UserProject } from "@/lib/portfolio";
import { migrateProject } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PHASES: ProjectPhase[] = ["build", "launch", "revenue", "paused"];

function parseProject(body: unknown): UserProject | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const id = typeof b.id === "string" ? b.id.trim() : "";
  const opportunitySlug = typeof b.opportunitySlug === "string" ? b.opportunitySlug.trim() : "";
  const phase = typeof b.phase === "string" ? b.phase : "";
  const currentMrr = typeof b.currentMrr === "number" ? b.currentMrr : Number(b.currentMrr);
  const startedAt = typeof b.startedAt === "string" ? b.startedAt : undefined;
  const createdAt = typeof b.createdAt === "string" ? b.createdAt : undefined;
  const targetScenario = b.targetScenario;
  const hasIdeaBrief =
    b.ideaBrief != null && typeof b.ideaBrief === "object";
  const projectSource =
    typeof b.projectSource === "string" ? b.projectSource : undefined;
  const isIdeaOrGithub =
    hasIdeaBrief || projectSource === "idea" || projectSource === "github";

  if (!id || !VALID_PHASES.includes(phase as ProjectPhase)) {
    return null;
  }
  if (!isIdeaOrGithub && !opportunitySlug) {
    return null;
  }
  if (!Number.isFinite(currentMrr) || currentMrr < 0) return null;
  if (!startedAt || !createdAt) return null;
  if (targetScenario !== "Prudent" && targetScenario !== "Réaliste" && targetScenario !== "Optimiste") {
    return null;
  }

  return migrateProject(body as UserProject);
}

export async function PUT(request: Request) {
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

  const project = parseProject(body);
  if (!project) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    await syncUserProject(user.id, project);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
