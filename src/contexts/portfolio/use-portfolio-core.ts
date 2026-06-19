"use client";

import { useContext } from "react";
import { PortfolioContext } from "./portfolio-context-instance";
import type { PortfolioContextValue } from "./portfolio-types";

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}

/** Retourne null hors workspace (navbar marketing). */
export function useOptionalPortfolio(): PortfolioContextValue | null {
  return useContext(PortfolioContext);
}
