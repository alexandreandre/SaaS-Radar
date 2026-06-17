import "server-only";
import { FavoritesTableMissingError, isFavoritesTableMissingError } from "@/lib/favorites.errors";
import { mergeFavoriteSlugs } from "@/lib/favorites.shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function throwIfTableMissing(error: { message: string } | null): void {
  if (error && isFavoritesTableMissingError(error)) {
    throw new FavoritesTableMissingError(error.message);
  }
}

export async function listFavoriteSlugs(userId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("opportunity_favorites")
    .select("opportunity_slug")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  throwIfTableMissing(error);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.opportunity_slug);
}

export async function addFavorite(userId: string, slug: string): Promise<void> {
  const normalized = slug.trim();
  if (!normalized) throw new Error("slug invalide");

  const supabase = await createServerSupabaseClient();
  const { data: opp } = await supabase
    .from("opportunities")
    .select("slug")
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (!opp) throw new Error("Opportunité introuvable");

  const { error } = await supabase.from("opportunity_favorites").upsert(
    { user_id: userId, opportunity_slug: normalized },
    { onConflict: "user_id,opportunity_slug", ignoreDuplicates: true }
  );

  throwIfTableMissing(error);
  if (error) throw new Error(error.message);
}

export async function removeFavorite(userId: string, slug: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("opportunity_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("opportunity_slug", slug.trim());

  throwIfTableMissing(error);
  if (error) throw new Error(error.message);
}

export async function mergeFavorites(userId: string, incomingSlugs: string[]): Promise<string[]> {
  const existing = await listFavoriteSlugs(userId);
  const merged = mergeFavoriteSlugs(existing, incomingSlugs);

  if (merged.length === 0) return [];

  const supabase = await createServerSupabaseClient();
  const { data: validOpps } = await supabase
    .from("opportunities")
    .select("slug")
    .eq("status", "published")
    .in("slug", merged);

  const valid = new Set((validOpps ?? []).map((o) => o.slug));
  const toInsert = merged.filter((s) => valid.has(s));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("opportunity_favorites").upsert(
      toInsert.map((opportunity_slug) => ({ user_id: userId, opportunity_slug })),
      { onConflict: "user_id,opportunity_slug", ignoreDuplicates: true }
    );
    throwIfTableMissing(error);
    if (error) throw new Error(error.message);
  }

  return listFavoriteSlugs(userId);
}
