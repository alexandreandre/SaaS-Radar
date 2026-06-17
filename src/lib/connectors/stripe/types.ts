export type StripeRakCredential = {
  mode: "rak";
  secretKey: string;
  livemode: boolean;
  currency: string;
  accountId?: string;
};

export type StripeOAuthCredential = {
  mode: "oauth";
  accessToken: string;
  refreshToken?: string;
  stripeAccountId: string;
  livemode: boolean;
  currency: string;
};

export type StripeCredential = StripeRakCredential | StripeOAuthCredential;

export type StripeAccountMeta = {
  accountLabel: string;
  livemode: boolean;
  currency: string;
  defaultCurrency?: string;
  businessName?: string;
};

export type StripeGrowthChangeType =
  | "new"
  | "reactivation"
  | "expansion"
  | "contraction"
  | "churn"
  | "fx_adjustment";

export type AnalyticsMetricRow = {
  timestamp: string;
  dimensions?: Record<string, string>;
  results: Array<{
    name: string;
    value: number;
    currency?: string | null;
  }>;
};

export type AnalyticsQueryResult = {
  data: AnalyticsMetricRow[];
};

export type StripeAccountResponse = {
  id: string;
  business_profile?: { name?: string | null };
  default_currency?: string;
  settings?: { dashboard?: { display_name?: string | null } };
};
