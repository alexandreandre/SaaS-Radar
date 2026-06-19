import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadUserProjects } from "@/lib/portfolio-sync";
import { countOverdueCheckIns } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Résumé léger portfolio pour la navbar (sans charger portfolio-context). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ overdueCheckIns: 0, projectCount: 0 });
  }

  try {
    const projects = await loadUserProjects(user.id);
    return NextResponse.json({
      overdueCheckIns: countOverdueCheckIns(projects),
      projectCount: projects.length,
    });
  } catch {
    return NextResponse.json({ overdueCheckIns: 0, projectCount: 0 });
  }
}
