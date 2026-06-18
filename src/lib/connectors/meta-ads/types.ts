export type MetaAdsCredential = {
  accessToken: string;
  accessTokenExpiresAt: string;
  adAccountId?: string;
  currencyCode?: string;
};

export type MetaAdsAction = {
  action_type?: string;
  value?: string;
};

export type MetaAdsInsightRow = {
  date_start?: string;
  date_stop?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaAdsAction[];
};

export type MetaAdsGraphList<T> = {
  data?: T[];
  paging?: {
    next?: string;
    cursors?: { before?: string; after?: string };
  };
};

export type MetaAdsAdAccount = {
  id: string;
  account_id?: string;
  name?: string;
  currency?: string;
  account_status?: number;
};

export type MetaAdsAccountSummary = {
  adAccountId: string;
  name: string;
  currencyCode?: string;
  accountStatus?: number;
};

export type MetaAdsInsightsTimeRange = {
  since: string;
  until: string;
};
