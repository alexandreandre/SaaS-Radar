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

  const migrated = migrateProject(body as UserProject);
  const now = new Date().toISOString();
  const normalized: UserProject = {
    ...migrated,
    startedAt: migrated.startedAt ?? migrated.createdAt ?? now.slice(0, 10),
    createdAt: migrated.createdAt ?? migrated.startedAt ?? now,
    targetScenario: migrated.targetScenario ?? "Réaliste",
    currentMrr: Number.isFinite(migrated.currentMrr) ? migrated.currentMrr : 0,
  };

  const id = normalized.id?.trim() ?? "";
  const opportunitySlug = normalized.opportunitySlug?.trim() ?? "";
  const phase = normalized.phase;
  const hasIdeaBrief = normalized.ideaBrief != null;
  const projectSource = normalized.projectSource;
  const isIdeaOrGithub =
    hasIdeaBrief || projectSource === "idea" || projectSource === "github";

  if (!id || !VALID_PHASES.includes(phase)) {
    return null;
  }
  if (!isIdeaOrGithub && !opportunitySlug) {
    return null;
  }
  if (normalized.currentMrr < 0) return null;
  if (
    normalized.targetScenario !== "Prudent" &&
    normalized.targetScenario !== "Réaliste" &&
    normalized.targetScenario !== "Optimiste"
  ) {
    return null;
  }

  return normalized;
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
