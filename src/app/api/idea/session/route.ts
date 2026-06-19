import { NextResponse } from "next/server";
import { evaluateIdeaClarity } from "@/lib/idea/clarify";
import { checkIdeaSessionRateLimit } from "@/lib/idea/rate-limit";
import { ideaClarifyTurnSchema, ideaDraftSchema } from "@/lib/idea/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const rate = checkIdeaSessionRateLimit(clientKey(request));
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Limite quotidienne atteinte. Réessayez demain." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const initialIdea = typeof b.initialIdea === "string" ? b.initialIdea.trim() : "";
  const rawTurns = Array.isArray(b.turns) ? b.turns : [];

  if (!initialIdea || initialIdea.length < 8) {
    return NextResponse.json(
      { error: "Décrivez votre idée en au moins 8 caractères." },
      { status: 400 },
    );
  }

  const turns = rawTurns
    .map((t) => {
      const parsed = ideaClarifyTurnSchema.safeParse(t);
      return parsed.success ? parsed.data : null;
    })
    .filter((t): t is NonNullable<typeof t> => t != null && t.answer.trim().length > 0);

  const draft = ideaDraftSchema.safeParse({ initialIdea, turns });
  if (!draft.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    const result = await evaluateIdeaClarity(draft.data);

    if (result.status === "ready") {
      return NextResponse.json({
        status: "ready",
        summary: result.summary,
        draft: { ...draft.data, summary: result.summary },
      });
    }

    return NextResponse.json({
      status: "clarify",
      insight: result.insight,
      dimension: result.dimension,
      question: result.question,
      questionType: result.questionType,
      suggestions: result.suggestions,
      allowCustom: result.allowCustom,
      draft: draft.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyse impossible";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
