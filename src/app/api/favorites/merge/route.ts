import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mergeFavorites } from "@/lib/favorites";
import { isFavoritesTableMissingError } from "@/lib/favorites.errors";

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

  const raw = (body as { slugs?: unknown }).slugs;
  const slugs = Array.isArray(raw)
    ? raw.filter((s): s is string => typeof s === "string" && s.length > 0)
    : [];

  try {
    const merged = await mergeFavorites(user.id, slugs);
    return NextResponse.json({ slugs: merged });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        ...(isFavoritesTableMissingError(err) ? { code: "FAVORITES_TABLE_MISSING" } : {}),
      },
      { status: isFavoritesTableMissingError(err) ? 503 : 500 }
    );
  }
}
