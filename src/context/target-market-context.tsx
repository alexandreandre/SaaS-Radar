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
import { formatTargetMarket } from "@/lib/target-market-fit";
import { worldMarkets } from "@/data/world-markets";

const STORAGE_KEY = "saas-radar-target-market";

type TargetMarket = { code: string; name: string; flag: string };

interface TargetMarketContextValue {
  target: TargetMarket;
  setTargetCode: (code: string) => void;
  pickerOptions: TargetMarket[];
}

const TargetMarketContext = createContext<TargetMarketContextValue | null>(null);

/** Marchés proposés en priorité dans le sélecteur */
const FEATURED_CODES = [
  "FR", "US", "GB", "DE", "CA", "AU", "ES", "IT", "NL", "BE", "CH", "BR", "MX", "IN", "SG", "JP", "SE", "IL",
];

export function TargetMarketProvider({ children }: { children: ReactNode }) {
  const [targetCode, setTargetCodeState] = useState("FR");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && worldMarkets.some((m) => m.code === saved)) {
      setTargetCodeState(saved);
    }
  }, []);

  const setTargetCode = useCallback((code: string) => {
    const upper = code.toUpperCase();
    setTargetCodeState(upper);
    localStorage.setItem(STORAGE_KEY, upper);
  }, []);

  const pickerOptions = useMemo(() => {
    const featured = FEATURED_CODES.map((c) => formatTargetMarket(c));
    const rest = worldMarkets
      .filter((m) => !FEATURED_CODES.includes(m.code) && m.heatScore >= 40)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .slice(0, 40)
      .map((m) => formatTargetMarket(m.code));
    return [...featured, ...rest];
  }, []);

  const target = useMemo(() => formatTargetMarket(targetCode), [targetCode]);

  const value = useMemo(
    () => ({ target, setTargetCode, pickerOptions }),
    [target, setTargetCode, pickerOptions]
  );

  return (
    <TargetMarketContext.Provider value={value}>{children}</TargetMarketContext.Provider>
  );
}

export function useTargetMarket() {
  const ctx = useContext(TargetMarketContext);
  if (!ctx) throw new Error("useTargetMarket must be used within TargetMarketProvider");
  return ctx;
}
