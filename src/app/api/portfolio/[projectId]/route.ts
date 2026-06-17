import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteUserProject } from "@/lib/portfolio-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { projectId } = await params;
  if (!projectId?.trim()) {
    return NextResponse.json({ error: "Projet invalide" }, { status: 400 });
  }

  try {
    await deleteUserProject(user.id, projectId.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
