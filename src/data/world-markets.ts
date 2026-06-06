import generatedMarkets from "@/data/world-markets.generated.json";
import { opportunities } from "@/data/opportunities";
import type { WorldMarket, TopEarner, MarketScope } from "@/types/world-market";

export const worldMarkets: WorldMarket[] = generatedMarkets as WorldMarket[];

const marketMap = new Map(worldMarkets.map((m) => [m.code, m]));

export function getMarketByCode(code: string | null | undefined): WorldMarket | undefined {
  if (!code) return undefined;
  return marketMap.get(code.toUpperCase());
}

export const marketByCode: Record<string, WorldMarket> = Object.fromEntries(
  worldMarkets.map((m) => [m.code, m])
);

export { getHeatColor, getHeatColorAmbient, MAP_COLORS } from "@/lib/map-colors";

export function getScopeLabel(scope: MarketScope, targetMarketName?: string): string {
  switch (scope) {
    case "priority":
      return targetMarketName ? `Priorité → ${targetMarketName}` : "Priorité import";
    case "active":
      return "Marché actif";
    case "emerging":
      return "Émergent";
    case "watch":
      return "Veille";
  }
}

export function getGlobalStats() {
  const withDb = worldMarkets.filter((m) => m.opportunitySlugs.length > 0);
  return {
    countriesTracked: worldMarkets.length,
    totalMicroSaas: worldMarkets.reduce((s, m) => s + m.trackedMicroSaas, 0),
    inDatabase: opportunities.length,
    priorityMarkets: worldMarkets.filter((m) => m.scope === "priority").length,
    hottestMarket: worldMarkets.reduce((a, b) => (a.heatScore > b.heatScore ? a : b)),
    withOpportunities: withDb.length,
  };
}

export type { TopEarner };
