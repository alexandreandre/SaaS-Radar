import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadUserProjects } from "@/lib/portfolio-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dernière synchro serveur par projet (source de vérité multi-appareils). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const projects = await loadUserProjects(user.id);
    return NextResponse.json({
      global: "synced" as const,
      projects: Object.fromEntries(projects.map((p) => [p.id, { status: "synced" as const }])),
      count: projects.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
