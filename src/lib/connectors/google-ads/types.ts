export type GoogleAdsCredential = {
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  customerId?: string;
  loginCustomerId?: string;
  currencyCode?: string;
};

export type GoogleAdsGaqlRow = {
  segments?: {
    month?: string;
  };
  metrics?: {
    costMicros?: string;
    impressions?: string;
    clicks?: string;
    conversions?: string | number;
  };
  customer?: {
    id?: string;
    descriptiveName?: string;
    currencyCode?: string;
  };
};

export type GoogleAdsSearchStreamChunk = {
  results?: GoogleAdsGaqlRow[];
};

export type GoogleAdsAccountSummary = {
  customerId: string;
  descriptiveName: string;
  currencyCode?: string;
};
