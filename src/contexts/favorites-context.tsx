"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  clearGuestFavoriteSlugs,
  mergeFavoriteSlugs,
  readGuestFavoriteSlugs,
  writeGuestFavoriteSlugs,
} from "@/lib/favorites.shared";

type FavoritesContextValue = {
  hydrated: boolean;
  signedIn: boolean;
  favoriteSlugs: string[];
  favoritesCount: number;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => Promise<void>;
  togglingSlug: string | null;
  guestHint: string | null;
  clearGuestHint: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

async function fetchServerFavorites(): Promise<string[]> {
  const res = await fetch("/api/favorites");
  if (res.status === 401) return [];
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? "Erreur favoris");
  }
  const json = (await res.json()) as { slugs?: string[] };
  return json.slugs ?? [];
}

async function mergeGuestFavorites(localSlugs: string[]): Promise<string[]> {
  const res = await fetch("/api/favorites/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slugs: localSlugs }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? "Erreur fusion favoris");
  }
  const json = (await res.json()) as { slugs?: string[] };
  return json.slugs ?? [];
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [guestHint, setGuestHint] = useState<string | null>(null);
  const mergeDoneRef = useRef(false);

  const favoriteSet = useMemo(() => new Set(favoriteSlugs), [favoriteSlugs]);

  const loadForUser = useCallback(async (mergeLocal: boolean) => {
    let localSlugs: string[] = [];
    if (mergeLocal) {
      localSlugs = readGuestFavoriteSlugs();
    }
    if (localSlugs.length > 0) {
      const merged = await mergeGuestFavorites(localSlugs);
      clearGuestFavoriteSlugs();
      setFavoriteSlugs(merged);
    } else {
      const slugs = await fetchServerFavorites();
      setFavoriteSlugs(slugs);
    }
  }, []);

  const loadGuest = useCallback(() => {
    setFavoriteSlugs(readGuestFavoriteSlugs());
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      if (user) {
        setSignedIn(true);
        mergeDoneRef.current = true;
        try {
          await loadForUser(true);
        } catch {
          setFavoriteSlugs(readGuestFavoriteSlugs());
        }
      } else {
        setSignedIn(false);
        loadGuest();
      }
      setHydrated(true);
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      if (session?.user) {
        setSignedIn(true);
        if (event === "SIGNED_IN" && !mergeDoneRef.current) {
          mergeDoneRef.current = true;
          try {
            await loadForUser(true);
          } catch {
            setFavoriteSlugs(readGuestFavoriteSlugs());
          }
        } else if (event === "SIGNED_IN") {
          try {
            const slugs = await fetchServerFavorites();
            setFavoriteSlugs(slugs);
          } catch {
            /* keep current */
          }
        }
      } else {
        setSignedIn(false);
        mergeDoneRef.current = false;
        loadGuest();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadForUser, loadGuest]);

  const isFavorite = useCallback((slug: string) => favoriteSet.has(slug), [favoriteSet]);

  const toggleFavorite = useCallback(
    async (slug: string) => {
      const normalized = slug.trim();
      if (!normalized || togglingSlug) return;

      setTogglingSlug(normalized);
      const wasFavorite = favoriteSet.has(normalized);

      setFavoriteSlugs((prev) => {
        if (wasFavorite) return prev.filter((s) => s !== normalized);
        return mergeFavoriteSlugs(prev, [normalized]);
      });

      try {
        if (signedIn) {
          const res = await fetch(
            wasFavorite
              ? `/api/favorites?slug=${encodeURIComponent(normalized)}`
              : "/api/favorites",
            wasFavorite
              ? { method: "DELETE" }
              : {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ slug: normalized }),
                }
          );
          if (!res.ok) throw new Error("Échec favori");
          const json = (await res.json()) as { slugs?: string[] };
          setFavoriteSlugs(json.slugs ?? []);
        } else {
          const next = wasFavorite
            ? readGuestFavoriteSlugs().filter((s) => s !== normalized)
            : mergeFavoriteSlugs(readGuestFavoriteSlugs(), [normalized]);
          writeGuestFavoriteSlugs(next);
          setFavoriteSlugs(next);
          if (!wasFavorite) {
            setGuestHint(
              "Connecte-toi pour retrouver tes favoris sur tous tes appareils."
            );
          }
        }
      } catch {
        setFavoriteSlugs((prev) => {
          if (wasFavorite) return mergeFavoriteSlugs(prev, [normalized]);
          return prev.filter((s) => s !== normalized);
        });
      } finally {
        setTogglingSlug(null);
      }
    },
    [favoriteSet, signedIn, togglingSlug]
  );

  const value = useMemo(
    () => ({
      hydrated,
      signedIn,
      favoriteSlugs,
      favoritesCount: favoriteSlugs.length,
      isFavorite,
      toggleFavorite,
      togglingSlug,
      guestHint,
      clearGuestHint: () => setGuestHint(null),
    }),
    [
      hydrated,
      signedIn,
      favoriteSlugs,
      isFavorite,
      toggleFavorite,
      togglingSlug,
      guestHint,
    ]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
