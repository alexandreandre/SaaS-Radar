/** Clé localStorage pour favoris invités. */
export const FAVORITES_STORAGE_KEY = "saas-radar:favorites";

/** Fusionne deux listes de slugs (ordre : existants puis nouveaux uniques). */
export function mergeFavoriteSlugs(existing: string[], incoming: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const slug of [...existing, ...incoming]) {
    const s = slug.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    merged.push(s);
  }
  return merged;
}

export function readGuestFavoriteSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string" && s.length > 0)
      : [];
  } catch {
    return [];
  }
}

export function writeGuestFavoriteSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(slugs));
}

export function clearGuestFavoriteSlugs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FAVORITES_STORAGE_KEY);
}
