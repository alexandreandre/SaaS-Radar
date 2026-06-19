export type FathomCredential = {
  apiKey: string;
  siteId: string;
  signupEventId?: string | null;
  signupEventName?: string | null;
};

export type FathomAccountMeta = {
  accountLabel: string;
  timezone?: string;
  hasSignupEvent: boolean;
};

export type FathomAccount = {
  id: number;
  object: "account";
  name: string;
  email: string;
};

export type FathomSite = {
  id: string;
  object: "site";
  name: string;
  sharing?: string;
  created_at?: string;
  timezone?: string;
};

export type FathomSitesListResponse = {
  object: "list";
  url?: string;
  has_more?: boolean;
  data: FathomSite[];
};

export type FathomEvent = {
  id: string;
  object: "event";
  name: string;
  created_at?: string;
};

export type FathomEventsListResponse = {
  object: "list";
  url?: string;
  has_more?: boolean;
  data: FathomEvent[];
};

export type FathomAggregationRow = Record<string, string | number | undefined> & {
  date?: string;
  timestamp?: string;
  visits?: string | number;
  unique_conversions?: string | number;
};

export type FathomAggregationParams = {
  entity: "pageview" | "event";
  entity_id?: string;
  site_id?: string;
  entity_name?: string;
  aggregates: string;
  date_grouping?: "hour" | "day" | "month" | "year";
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  limit?: number;
};
