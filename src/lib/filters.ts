import type { Opportunity, Sector, ClientType, TechComplexity, FranceCompetition } from "@/types/opportunity";

export type SortOption = "opportunity" | "newest" | "buildability" | "margin";

export interface FilterState {
  countryCode: string | null;
  sectors: Sector[];
  clientType: ClientType | "all";
  techComplexity: TechComplexity[];
  franceCompetition: FranceCompetition[];
  revenueMin: number;
  buildableUnder30: boolean;
  b2bOnly: boolean;
  search: string;
  sort: SortOption;
  thisWeekOnly: boolean;
  favoritesOnly: boolean;
}

export const defaultFilters: FilterState = {
  countryCode: null,
  sectors: [],
  clientType: "all",
  techComplexity: [],
  franceCompetition: [],
  revenueMin: 0,
  buildableUnder30: false,
  b2bOnly: false,
  search: "",
  sort: "opportunity",
  thisWeekOnly: false,
  favoritesOnly: false,
};

export function filterOpportunities(
  items: Opportunity[],
  filters: FilterState
): Opportunity[] {
  let result = [...items];

  if (filters.countryCode) {
    result = result.filter((o) => o.originCountryCode === filters.countryCode);
  }
  if (filters.sectors.length) {
    result = result.filter((o) => filters.sectors.includes(o.sector));
  }
  if (filters.clientType !== "all") {
    result = result.filter((o) => o.clientType === filters.clientType);
  }
  if (filters.techComplexity.length) {
    result = result.filter((o) => filters.techComplexity.includes(o.techComplexity));
  }
  if (filters.franceCompetition.length) {
    result = result.filter((o) => filters.franceCompetition.includes(o.franceCompetition));
  }
  if (filters.revenueMin > 0) {
    result = result.filter((o) => o.revenueMax >= filters.revenueMin);
  }
  if (filters.buildableUnder30) {
    result = result.filter((o) => o.buildableUnder30Days);
  }
  if (filters.b2bOnly) {
    result = result.filter((o) => o.clientType === "b2b");
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.targetClient.toLowerCase().includes(q) ||
        o.pitch.toLowerCase().includes(q)
    );
  }
  if (filters.thisWeekOnly) {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    result = result.filter((o) => {
      const ts = o.publishedAt ?? o.createdAt;
      return new Date(ts).getTime() >= weekAgo;
    });
  }

  switch (filters.sort) {
    case "opportunity":
      result.sort((a, b) => b.scores.opportunity - a.scores.opportunity);
      break;
    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.publishedAt ?? b.createdAt).getTime() -
          new Date(a.publishedAt ?? a.createdAt).getTime()
      );
      break;
    case "buildability":
      result.sort((a, b) => b.scores.buildability - a.scores.buildability);
      break;
    case "margin":
      result.sort((a, b) => b.scores.margin - a.scores.margin);
      break;
  }

  return result;
}
