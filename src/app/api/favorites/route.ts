import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addFavorite, listFavoriteSlugs, removeFavorite } from "@/lib/favorites";
import { isFavoritesTableMissingError, toFavoritesHttpStatus } from "@/lib/favorites.errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const slugs = await listFavoriteSlugs(user.id);
    return NextResponse.json({ slugs });
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

  const slug = typeof (body as { slug?: unknown }).slug === "string" ? (body as { slug: string }).slug : "";
  if (!slug.trim()) {
    return NextResponse.json({ error: "slug requis" }, { status: 400 });
  }

  try {
    await addFavorite(user.id, slug);
    const slugs = await listFavoriteSlugs(user.id);
    return NextResponse.json({ slugs });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        ...(isFavoritesTableMissingError(err) ? { code: "FAVORITES_TABLE_MISSING" } : {}),
      },
      { status: toFavoritesHttpStatus(err) }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug requis" }, { status: 400 });
  }

  try {
    await removeFavorite(user.id, slug);
    const slugs = await listFavoriteSlugs(user.id);
    return NextResponse.json({ slugs });
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
