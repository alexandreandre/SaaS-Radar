export type PlausibleCredential = {
  apiKey: string;
  siteId: string;
  signupGoalDisplayName?: string | null;
  apiBaseUrl?: string;
};

export type PlausibleAccountMeta = {
  accountLabel: string;
  timezone?: string;
  hasSignupGoal: boolean;
};

export type PlausibleStatsQuery = {
  site_id: string;
  metrics: string[];
  date_range: string | [string, string];
  dimensions?: string[];
  filters?: unknown[];
  include?: Record<string, unknown>;
};

export type PlausibleQueryResultRow = {
  metrics: (number | null)[];
  dimensions: string[];
};

export type PlausibleQueryResponse = {
  results: PlausibleQueryResultRow[];
  meta?: Record<string, unknown>;
  query?: PlausibleStatsQuery;
};

export type PlausibleGoal = {
  id: string;
  goal_type: string;
  display_name: string;
  event_name?: string | null;
  page_path?: string | null;
};

export type PlausibleGoalsResponse = {
  goals: PlausibleGoal[];
  meta?: {
    after?: string | null;
    before?: string | null;
    limit?: number;
  };
};

export type PlausibleSiteResponse = {
  domain: string;
  timezone?: string;
};
