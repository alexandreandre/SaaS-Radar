export type CrispCredential = {
  websiteId: string;
  websiteName?: string | null;
  timezone?: string;
};

export type CrispAccountMeta = {
  accountLabel: string;
  websiteName: string;
  domain?: string;
  timezone: string;
};

export type CrispApiEnvelope<T> = {
  error: boolean;
  reason?: string;
  data: T;
};

export type CrispWebsiteData = {
  website_id: string;
  name: string;
  domain?: string;
};

export type CrispAnalyticsGeneratePoint = {
  period?: string;
  value?: number;
  split_by?: string;
  hits?: number;
  unique_hits?: number;
  sum_value?: number;
  sum_hits?: number;
};

export type CrispAnalyticsGenerateData = {
  data?: CrispAnalyticsGeneratePoint[];
};

export type CrispAnalyticsGenerateQuery = {
  metric:
    | "conversation"
    | "visitor_visit"
    | "people_created"
    | "conversation_state";
  type: "total" | "unique" | "response_time" | "rating" | "average";
  aggregator?: "average" | "moving_average" | "median" | "minimum" | "maximum" | "sum";
  split_by?: string;
  date: {
    from: string;
    to: string;
    split: "all" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
    timezone: string;
  };
};

export type CrispConversationListItem = {
  session_id: string;
  state?: "pending" | "unresolved" | "resolved";
  status?: number;
};
