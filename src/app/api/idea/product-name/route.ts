import { NextResponse } from "next/server";
import { getCurrentUser, getTier } from "@/lib/auth";
import { generateProductNameSuggestions } from "@/lib/ai/gemini";
import {
  buildIdeaProductNameUserPrompt,
  buildProductNameSystemPrompt,
} from "@/lib/build/product-name";
import { checkIdeaSessionRateLimit } from "@/lib/idea/rate-limit";
import { cockpitApiGuard } from "@/lib/product-phase-api";
import { hasTier } from "@/lib/tier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const cockpitBlocked = await cockpitApiGuard();
  if (cockpitBlocked) return cockpitBlocked;

  const rate = checkIdeaSessionRateLimit(`name:${clientKey(request)}`);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Limite quotidienne atteinte. Réessayez demain." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const tier = await getTier();
  if (!hasTier(tier, "builder")) {
    return NextResponse.json(
      { error: "Plan Builder requis pour générer des noms" },
      { status: 403 },
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
  const summary = typeof b.summary === "string" ? b.summary.trim() : undefined;

  if (!initialIdea || initialIdea.length < 8) {
    return NextResponse.json({ error: "Idée invalide" }, { status: 400 });
  }

  try {
    const generated = await generateProductNameSuggestions(
      buildProductNameSystemPrompt(),
      buildIdeaProductNameUserPrompt({ initialIdea, summary }),
    );
    return NextResponse.json({ suggestions: generated.suggestions.slice(0, 3) });
  } catch (err) {
    const message =
      err instanceof Error && !err.message.startsWith("[")
        ? err.message
        : "La génération a échoué. Réessayez dans quelques instants.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
