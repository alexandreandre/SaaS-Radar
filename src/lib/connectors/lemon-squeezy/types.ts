export type LemonSqueezyCredential = {
  apiKey: string;
  storeId: string;
  storeName: string;
  currency: string;
  testMode: boolean;
};

export type LemonSqueezyAccountMeta = {
  accountLabel: string;
  storeId: string;
  currency: string;
  testMode: boolean;
};

export type LemonSqueezyStoreSummary = {
  id: string;
  name: string;
  currency: string;
  testMode: boolean;
};

export type LemonSqueezyJsonApiResource<T> = {
  type: string;
  id: string;
  attributes: T;
};

export type LemonSqueezyListResponse<T> = {
  data: LemonSqueezyJsonApiResource<T>[];
  meta?: {
    page?: {
      currentPage: number;
      lastPage: number;
      perPage: number;
      total: number;
    };
  };
  links?: {
    next?: string | null;
    last?: string;
  };
};

export type LemonSqueezySingleResponse<T> = {
  data: LemonSqueezyJsonApiResource<T>;
};

export type LemonSqueezyStoreAttributes = {
  name: string;
  slug: string;
  domain: string;
  url: string;
  currency: string;
  total_revenue: number;
  test_mode?: boolean;
};

export type LemonSqueezySubscriptionItem = {
  id: number;
  subscription_id: number;
  price_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type LemonSqueezySubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export type LemonSqueezySubscriptionAttributes = {
  store_id: number;
  customer_id: number;
  status: LemonSqueezySubscriptionStatus;
  cancelled: boolean;
  trial_ends_at: string | null;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
  first_subscription_item: LemonSqueezySubscriptionItem | null;
};

export type LemonSqueezyPriceAttributes = {
  variant_id: number;
  category: "one_time" | "subscription" | "lead_magnet" | "pwyw";
  scheme: "standard" | "package" | "graduated" | "volume";
  usage_aggregation: string | null;
  unit_price: number | null;
  unit_price_decimal: string | null;
  renewal_interval_unit: "day" | "week" | "month" | "year" | null;
  renewal_interval_quantity: number | null;
};

export type LemonSqueezySubscriptionRecord = {
  id: string;
  attributes: LemonSqueezySubscriptionAttributes;
};
