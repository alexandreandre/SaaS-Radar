export type IntercomRegion = "US" | "EU" | "AU" | string;

export type IntercomCredential = {
  accessToken: string;
  appId: string;
  appName: string;
  region: IntercomRegion;
  timezone: string;
};

export type IntercomAppInfo = {
  type?: string;
  id_code?: string;
  name?: string;
  timezone?: string;
  region?: string;
};

export type IntercomMeResponse = {
  type?: string;
  id?: string;
  name?: string;
  email?: string;
  app?: IntercomAppInfo | null;
};

export type IntercomSearchQuery =
  | {
      field: string;
      operator: string;
      value: string | number | boolean | null | string[];
    }
  | {
      operator: "AND" | "OR";
      value: IntercomSearchQuery[];
    };

export type IntercomConversationStatistics = {
  median_time_to_reply?: number | null;
  time_to_admin_reply?: number | null;
  first_admin_reply_at?: number | null;
};

export type IntercomConversationRating = {
  score?: number | null;
  replied_at?: number | null;
};

export type IntercomConversation = {
  id?: string;
  open?: boolean;
  statistics?: IntercomConversationStatistics | null;
  conversation_rating?: IntercomConversationRating | null;
};

export type IntercomSearchPages = {
  type?: string;
  page?: number;
  per_page?: number;
  total_pages?: number;
  next?: { starting_after?: string } | null;
};

export type IntercomSearchResponse<T> = {
  type?: string;
  total_count?: number;
  conversations?: T[];
  data?: T[];
  pages?: IntercomSearchPages | null;
};

export type IntercomTokenResponse = {
  token_type?: string;
  token?: string;
  access_token?: string;
  error?: string;
  errors?: Array<{ code?: string; message?: string }>;
};
