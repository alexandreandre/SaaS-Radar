import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createProjectFromGitHub } from "@/lib/portfolio";
import { syncUserProject } from "@/lib/portfolio-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let productName: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body === "object" && typeof (body as Record<string, unknown>).productName === "string") {
      productName = ((body as Record<string, unknown>).productName as string).trim() || undefined;
    }
  } catch {
    // body optional
  }

  try {
    const project = createProjectFromGitHub({ productName });
    await syncUserProject(user.id, project);
    return NextResponse.json({ projectId: project.id, project });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Création du projet impossible";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
