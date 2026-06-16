"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Tier } from "@/lib/tier";

const STORAGE_KEY = "saas-radar:preview-tier";

type TierContextValue = {
  tier: Tier;
  setTier: (tier: Tier) => void;
  /** Vrai si la valeur provient du serveur (compte authentifie) — non surchargeable. */
  isAuthenticated: boolean;
};

const TierContext = createContext<TierContextValue | null>(null);

function readStoredTier(): Tier {
  if (typeof window === "undefined") return "free";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "builder" || stored === "pro" || stored === "free") return stored;
  return "free";
}

export function TierProvider({
  children,
  serverTier = "free",
  isAuthenticated = false,
}: {
  children: ReactNode;
  /** Tier autoritatif (profiles.plan) injecte par le layout serveur. */
  serverTier?: Tier;
  isAuthenticated?: boolean;
}) {
  // Compte authentifie : la valeur serveur gagne immediatement (aucun flash localStorage).
  const [tier, setTierState] = useState<Tier>(serverTier);
  const [hydrated, setHydrated] = useState(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      // La source de verite est le serveur : purge la cle preview pour eviter
      // tout flash de tier client lors d'une future deconnexion / navigation.
      localStorage.removeItem(STORAGE_KEY);
      setTierState(serverTier);
      setHydrated(true);
      return;
    }
    // Visiteur non connecte : localStorage reste un fallback d'apercu.
    setTierState(readStoredTier());
    setHydrated(true);
  }, [isAuthenticated, serverTier]);

  const setTier = useCallback(
    (next: Tier) => {
      // Un compte authentifie ne peut pas s'auto-attribuer un tier (serveur autoritatif).
      if (isAuthenticated) return;
      setTierState(next);
      localStorage.setItem(STORAGE_KEY, next);
    },
    [isAuthenticated]
  );

  const value = useMemo(
    () => ({
      tier: hydrated ? tier : isAuthenticated ? serverTier : "free",
      setTier,
      isAuthenticated,
    }),
    [tier, setTier, hydrated, isAuthenticated, serverTier]
  );

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier(): TierContextValue {
  const ctx = useContext(TierContext);
  if (!ctx) throw new Error("useTier must be used within TierProvider");
  return ctx;
}
