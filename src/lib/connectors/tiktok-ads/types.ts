export type TikTokAdsCredential = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
  advertiserId?: string;
  currencyCode?: string;
};

export type TikTokAdsReportRow = {
  dimensions?: {
    stat_time_month?: string;
    stat_time_day?: string;
  };
  metrics?: {
    spend?: string | number;
    impressions?: string | number;
    clicks?: string | number;
    conversion?: string | number;
  };
};

export type TikTokAdsAdvertiser = {
  advertiser_id?: string;
  advertiser_name?: string;
  currency?: string;
  status?: string;
};

export type TikTokAdsAdvertiserSummary = {
  advertiserId: string;
  name: string;
  currencyCode?: string;
  status?: string;
};

export type TikTokAdsReportDateRange = {
  startDate: string;
  endDate: string;
};
