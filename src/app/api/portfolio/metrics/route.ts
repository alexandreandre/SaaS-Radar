import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncUserProject } from "@/lib/portfolio-sync";
import type { UserProject } from "@/lib/portfolio";
import { migrateProject } from "@/lib/portfolio";
import { portfolioMetricsBodySchema } from "@/lib/portfolio-sync-schema";
import { apiErrorResponse } from "@/lib/api-error-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const parsed = portfolioMetricsBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const project = migrateProject(body as UserProject);

  try {
    await syncUserProject(user.id, project);
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return apiErrorResponse("/api/portfolio/metrics", 500, message);
  }
}
