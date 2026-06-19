export type ZendeskCredential = {
  subdomain: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  refreshTokenExpiresAt?: string;
  accountName?: string;
};

export type ZendeskTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
};

export type ZendeskSearchCountResponse = {
  count?: number;
};

export type ZendeskDurationMinutes = {
  business?: number;
  calendar?: number;
};

export type ZendeskTicketMetric = {
  id?: number;
  ticket_id?: number;
  created_at?: string;
  reply_time_in_minutes?: ZendeskDurationMinutes | null;
};

export type ZendeskTicketMetricsResponse = {
  ticket_metrics?: ZendeskTicketMetric[];
  meta?: {
    has_more?: boolean;
    after_cursor?: string;
    before_cursor?: string;
  };
};

export type ZendeskSatisfactionRating = {
  id?: number;
  score?: string;
  created_at?: string;
};

export type ZendeskSatisfactionRatingsResponse = {
  satisfaction_ratings?: ZendeskSatisfactionRating[];
  next_page?: string | null;
};

export type ZendeskAccountSettingsResponse = {
  settings?: {
    name?: string;
  };
};
