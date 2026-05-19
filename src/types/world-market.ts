export type TrendDirection = "rising" | "stable" | "emerging" | "cooling";

export interface TopEarner {
  name: string;
  mrrUsd: number;
  mrrLabel: string;
  category: string;
  franceAdaptable: boolean;
}

export type MarketScope = "priority" | "active" | "emerging" | "watch";

export interface WorldMarket {
  code: string;
  name: string;
  flag: string;
  scope: MarketScope;
  heatScore: number;
  trackedMicroSaas: number;
  newThisMonth: number;
  avgTopMrrUsd: number;
  trend: TrendDirection;
  trends: string[];
  topEarners: TopEarner[];
  opportunitySlugs: string[];
  insight: string;
}
