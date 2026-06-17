/** Erreur Supabase quand la table n'existe pas encore (migration 015 non appliquée). */
export class FavoritesTableMissingError extends Error {
  readonly code = "FAVORITES_TABLE_MISSING" as const;

  constructor(message = "Table opportunity_favorites absente — appliquer la migration 015") {
    super(message);
    this.name = "FavoritesTableMissingError";
  }
}

export function isFavoritesTableMissingError(err: unknown): boolean {
  if (err instanceof FavoritesTableMissingError) return true;
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("opportunity_favorites") &&
    (message.includes("PGRST205") ||
      message.includes("Could not find the table") ||
      message.includes("schema cache"))
  );
}

export function toFavoritesHttpStatus(err: unknown): number {
  return isFavoritesTableMissingError(err) ? 503 : 400;
}
