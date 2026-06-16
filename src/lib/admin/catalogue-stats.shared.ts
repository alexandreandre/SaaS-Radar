export type SectorCoverage = {
  sector: string;
  count: number;
  medianScore: number;
};

export type CountryCoverage = {
  code: string;
  name: string;
  flag: string;
  count: number;
  medianScore: number;
};

export type CatalogueStats = {
  byStatus: { published: number; archived: number; draft: number };
  pendingDrafts: number;
  publishedThisWeek: number;
  medianScore: number | null;
  lastPublishedAt: string | null;
  weeklyPick: { slug: string; name: string; score: number | null } | null;
  bySector: SectorCoverage[];
  byCountry: CountryCoverage[];
  marketsWithoutCoverage: { code: string; name: string; flag: string }[];
  diversity: {
    uniqueCountries: number;
    topCountryCode: string | null;
    topCountryShare: number;
  };
  alerts: string[];
  lastRun: { status: string; started_at: string; count_written: number } | null;
};
