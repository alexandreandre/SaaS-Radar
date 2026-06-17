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

type FavoritesApiError = { error?: string; code?: string };

function isFavoritesTableMissingResponse(status: number, json: FavoritesApiError): boolean {
  return status === 503 && json.code === "FAVORITES_TABLE_MISSING";
}

async function parseFavoritesResponse(res: Response): Promise<{ slugs: string[]; tableMissing: boolean }> {
  const json = (await res.json().catch(() => ({}))) as FavoritesApiError & { slugs?: string[] };
  if (res.status === 401) return { slugs: [], tableMissing: false };
  if (isFavoritesTableMissingResponse(res.status, json)) {
    return { slugs: readGuestFavoriteSlugs(), tableMissing: true };
  }
  if (!res.ok) {
    throw new Error(json.error ?? "Erreur favoris");
  }
  return { slugs: json.slugs ?? [], tableMissing: false };
}

async function fetchServerFavorites(): Promise<{ slugs: string[]; tableMissing: boolean }> {
  const res = await fetch("/api/favorites");
  return parseFavoritesResponse(res);
}

async function mergeGuestFavorites(localSlugs: string[]): Promise<{ slugs: string[]; tableMissing: boolean }> {
  const res = await fetch("/api/favorites/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slugs: localSlugs }),
  });
  const parsed = await parseFavoritesResponse(res);
  if (parsed.tableMissing) {
    return { slugs: mergeFavoriteSlugs(localSlugs, readGuestFavoriteSlugs()), tableMissing: true };
  }
  return parsed;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [guestHint, setGuestHint] = useState<string | null>(null);
  const mergeDoneRef = useRef(false);
  const serverUnavailableRef = useRef(false);

  const favoriteSet = useMemo(() => new Set(favoriteSlugs), [favoriteSlugs]);

  const loadForUser = useCallback(async (mergeLocal: boolean) => {
    let localSlugs: string[] = [];
    if (mergeLocal) {
      localSlugs = readGuestFavoriteSlugs();
    }
    if (localSlugs.length > 0) {
      const { slugs, tableMissing } = await mergeGuestFavorites(localSlugs);
      if (tableMissing) {
        serverUnavailableRef.current = true;
        writeGuestFavoriteSlugs(slugs);
      } else {
        clearGuestFavoriteSlugs();
      }
      setFavoriteSlugs(slugs);
    } else {
      const { slugs, tableMissing } = await fetchServerFavorites();
      if (tableMissing) {
        serverUnavailableRef.current = true;
        setFavoriteSlugs(readGuestFavoriteSlugs());
      } else {
        setFavoriteSlugs(slugs);
      }
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
            const { slugs, tableMissing } = await fetchServerFavorites();
            if (tableMissing) {
              serverUnavailableRef.current = true;
              setFavoriteSlugs(readGuestFavoriteSlugs());
            } else {
              setFavoriteSlugs(slugs);
            }
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
        if (signedIn && !serverUnavailableRef.current) {
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
          const { slugs, tableMissing } = await parseFavoritesResponse(res);
          if (tableMissing) {
            serverUnavailableRef.current = true;
            const next = wasFavorite
              ? readGuestFavoriteSlugs().filter((s) => s !== normalized)
              : mergeFavoriteSlugs(readGuestFavoriteSlugs(), [normalized]);
            writeGuestFavoriteSlugs(next);
            setFavoriteSlugs(next);
            return;
          }
          if (!res.ok) throw new Error("Échec favori");
          setFavoriteSlugs(slugs);
        } else if (signedIn && serverUnavailableRef.current) {
          const next = wasFavorite
            ? readGuestFavoriteSlugs().filter((s) => s !== normalized)
            : mergeFavoriteSlugs(readGuestFavoriteSlugs(), [normalized]);
          writeGuestFavoriteSlugs(next);
          setFavoriteSlugs(next);
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
