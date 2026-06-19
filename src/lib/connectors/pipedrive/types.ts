export type PipedriveCredential = {
  accessToken: string;
  refreshToken: string;
  apiDomain: string;
  tokenExpiresAt?: string;
  companyId?: number;
  companyName?: string;
  pipelineId?: number | null;
};

export type PipedriveTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  api_domain?: string;
  error?: string;
  error_description?: string;
};

export type PipedriveDealsSummaryData = {
  total_count?: number;
  total_currency_converted_value?: number;
  values_total?: Record<string, { value?: number; count?: number }>;
};

export type PipedriveDealsSummaryResponse = {
  success?: boolean;
  data?: PipedriveDealsSummaryData | null;
  error?: string;
};

export type PipedriveDeal = {
  id?: number;
  title?: string;
  status?: string;
  add_time?: string;
  won_time?: string | null;
  close_time?: string | null;
  value?: number;
};

export type PipedriveDealsListResponse = {
  success?: boolean;
  data?: PipedriveDeal[] | null;
  additional_data?: {
    pagination?: {
      start?: number;
      limit?: number;
      more_items_in_collection?: boolean;
      next_cursor?: string | null;
    };
  };
  error?: string;
};

export type PipedriveUserMeResponse = {
  success?: boolean;
  data?: {
    id?: number;
    name?: string;
    email?: string;
    company_id?: number;
    company_name?: string;
    company_domain?: string;
  } | null;
  error?: string;
};
