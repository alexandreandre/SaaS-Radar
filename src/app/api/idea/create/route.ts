import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateIdeaBrief } from "@/lib/idea/generate-brief";
import { ideaDraftSchema } from "@/lib/idea/schema";
import { createProjectFromIdea } from "@/lib/portfolio";
import { syncUserProject } from "@/lib/portfolio-sync";

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
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = ideaDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Brouillon d'idée invalide" }, { status: 400 });
  }

  const draft = parsed.data;
  if (!draft.summary && draft.turns.some((t) => !t.answer.trim())) {
    return NextResponse.json(
      { error: "Répondez aux questions de clarification avant de créer le projet." },
      { status: 400 },
    );
  }

  try {
    const ideaBrief = await generateIdeaBrief({
      initialIdea: draft.initialIdea,
      turns: draft.turns.filter((t) => t.answer.trim()),
      summary: draft.summary,
    });

    const project = createProjectFromIdea({
      ideaBrief,
      ideaSeed: draft.initialIdea,
      summary: draft.summary,
    });

    await syncUserProject(user.id, project);

    return NextResponse.json({
      status: "created",
      projectId: project.id,
      productName: project.productName,
      project,
    });
  } catch (err) {
    const message =
      err instanceof Error && !err.message.startsWith("[")
        ? err.message
        : "La génération de la fiche a échoué. Réessayez.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
