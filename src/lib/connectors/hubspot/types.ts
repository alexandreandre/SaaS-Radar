export type HubSpotCredential = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  hubId?: string;
  hubDomain?: string;
  portalLabel?: string;
};

export type HubSpotTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  message?: string;
  status?: string;
};

export type HubSpotAccessTokenInfo = {
  token?: string;
  user?: string;
  hub_domain?: string;
  scopes?: string[];
  hub_id?: number;
  app_id?: number;
  user_id?: number;
  token_type?: string;
};

export type HubSpotPipelineStage = {
  id: string;
  label?: string;
  displayOrder?: number;
  metadata?: {
    isClosed?: string | boolean;
    probability?: string | number;
  };
};

export type HubSpotPipeline = {
  id: string;
  label?: string;
  stages?: HubSpotPipelineStage[];
};

export type HubSpotDealProperties = {
  amount?: string | null;
  dealname?: string | null;
  dealstage?: string | null;
  pipeline?: string | null;
  closedate?: string | null;
  createdate?: string | null;
  hs_lastmodifieddate?: string | null;
};

export type HubSpotDeal = {
  id: string;
  properties?: HubSpotDealProperties;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
};

export type HubSpotSearchPaging = {
  next?: { after?: string } | null;
};

export type HubSpotDealsSearchResponse = {
  total?: number;
  results?: HubSpotDeal[];
  paging?: HubSpotSearchPaging | null;
};

export type HubSpotPipelinesResponse = {
  results?: HubSpotPipeline[];
};

export type HubSpotSearchFilter = {
  propertyName: string;
  operator: string;
  value?: string | number | boolean;
  values?: string[];
};

export type HubSpotSearchRequest = {
  filterGroups: Array<{ filters: HubSpotSearchFilter[] }>;
  properties?: string[];
  limit?: number;
  after?: string;
  sorts?: Array<{ propertyName: string; direction: "ASCENDING" | "DESCENDING" }>;
};
