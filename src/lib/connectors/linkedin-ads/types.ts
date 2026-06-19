export type LinkedInAdsCredential = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
  adAccountId?: string;
  adAccountUrn?: string;
  accountName?: string;
  currencyCode?: string;
};

export type LinkedInAdsDatePart = {
  year: number;
  month: number;
  day: number;
};

export type LinkedInAdsDateRange = {
  start: LinkedInAdsDatePart;
  end: LinkedInAdsDatePart;
};

export type LinkedInAdsAnalyticsRow = {
  clicks?: number;
  impressions?: number;
  costInLocalCurrency?: string | number;
  externalWebsiteConversions?: number;
  oneClickLeads?: number;
  dateRange?: LinkedInAdsDateRange;
  pivotValues?: string[];
};

export type LinkedInAdsAdAccount = {
  id?: number;
  name?: string;
  currency?: string;
  status?: string;
  test?: boolean;
};

export type LinkedInAdsAdAccountSummary = {
  adAccountId: string;
  adAccountUrn: string;
  name: string;
  currencyCode?: string;
  status?: string;
};

export type LinkedInAdsAnalyticsDateRange = {
  startYear: number;
  startMonth: number;
  startDay: number;
  endYear: number;
  endMonth: number;
  endDay: number;
};
