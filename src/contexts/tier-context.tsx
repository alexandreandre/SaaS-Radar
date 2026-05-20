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
};

const TierContext = createContext<TierContextValue | null>(null);

function readStoredTier(): Tier {
  if (typeof window === "undefined") return "free";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "builder" || stored === "pro" || stored === "free") return stored;
  return "free";
}

export function TierProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<Tier>("free");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTierState(readStoredTier());
    setHydrated(true);
  }, []);

  const setTier = useCallback((next: Tier) => {
    setTierState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ tier: hydrated ? tier : "free", setTier }), [tier, setTier, hydrated]);

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier(): TierContextValue {
  const ctx = useContext(TierContext);
  if (!ctx) throw new Error("useTier must be used within TierProvider");
  return ctx;
}
