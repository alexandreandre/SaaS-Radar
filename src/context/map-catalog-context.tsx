"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Projection légère d'une opportunité, suffisante pour la carte monde
 * (compteurs par pays + liste "Notre base" dans le panneau pays).
 * Alimentée au RUNTIME depuis Supabase (server component home) → reflète le
 * sourcing hebdomadaire sans redéploiement, contrairement au JSON figé au build.
 */
export type MapCatalogOpportunity = {
  slug: string;
  name: string;
  pitch: string;
  originCountryCode: string;
  scores: { opportunity: number };
  revenueMin: number;
  revenueMax: number;
};

type MapCatalogValue = {
  opportunities: MapCatalogOpportunity[];
  slugsByCountry: Record<string, string[]>;
  slugsForCountry: (code: string) => string[];
  opportunitiesForCountry: (code: string) => MapCatalogOpportunity[];
};

const EMPTY: MapCatalogValue = {
  opportunities: [],
  slugsByCountry: {},
  slugsForCountry: () => [],
  opportunitiesForCountry: () => [],
};

const MapCatalogContext = createContext<MapCatalogValue>(EMPTY);

export function MapCatalogProvider({
  opportunities,
  children,
}: {
  opportunities: MapCatalogOpportunity[];
  children: ReactNode;
}) {
  const value = useMemo<MapCatalogValue>(() => {
    const byCountry = new Map<string, MapCatalogOpportunity[]>();
    for (const opp of opportunities) {
      const code = opp.originCountryCode.toUpperCase();
      const list = byCountry.get(code);
      if (list) list.push(opp);
      else byCountry.set(code, [opp]);
    }

    const slugsByCountry: Record<string, string[]> = {};
    byCountry.forEach((list, code) => {
      slugsByCountry[code] = list.map((o) => o.slug);
    });

    return {
      opportunities,
      slugsByCountry,
      slugsForCountry: (code) => slugsByCountry[code?.toUpperCase()] ?? [],
      opportunitiesForCountry: (code) => byCountry.get(code?.toUpperCase()) ?? [],
    };
  }, [opportunities]);

  return <MapCatalogContext.Provider value={value}>{children}</MapCatalogContext.Provider>;
}

/** Lecture du catalogue carte runtime. Défaut vide si aucun provider (rendu dégradé sûr). */
export function useMapCatalog(): MapCatalogValue {
  return useContext(MapCatalogContext);
}
