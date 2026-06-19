export type PaddleCredential = {
  apiKey: string;
  sandbox: boolean;
  currency: string;
};

export type PaddleAccountMeta = {
  accountLabel: string;
  sandbox: boolean;
  currency: string;
  metricsAvailable: boolean;
};

export type PaddleMoney = {
  amount: string;
  currency_code: string;
};

export type PaddleBillingCycle = {
  interval: "day" | "week" | "month" | "year";
  frequency: number;
};

export type PaddlePrice = {
  id: string;
  billing_cycle: PaddleBillingCycle | null;
  unit_price: PaddleMoney;
};

export type PaddleSubscriptionItem = {
  status: string;
  quantity: number;
  recurring: boolean;
  price: PaddlePrice;
};

export type PaddleSubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "paused"
  | "trialing";

export type PaddleSubscriptionAttributes = {
  status: PaddleSubscriptionStatus;
  customer_id: string;
  currency_code: string;
  created_at: string;
  started_at: string | null;
  first_billed_at: string | null;
  canceled_at: string | null;
  paused_at: string | null;
  items: PaddleSubscriptionItem[];
};

export type PaddleSubscriptionRecord = {
  id: string;
  attributes: PaddleSubscriptionAttributes;
};

export type PaddleMetricsDatapoint = {
  timestamp: string;
  amount?: string;
  count?: number;
};

export type PaddleMetricsResponse = {
  data: {
    timeseries: PaddleMetricsDatapoint[];
    currency_code?: string;
    starts_at: string;
    ends_at: string;
    interval: string;
    updated_at: string;
  };
  meta: { request_id: string };
};

export type PaddleListResponse<T> = {
  data: Array<{ id: string } & T>;
  meta: {
    request_id: string;
    pagination?: {
      per_page: number;
      next: string | null;
      has_more: boolean;
      estimated_total: number;
    };
  };
};

export type PaddleTransactionPayment = {
  status: string;
  error_code?: string | null;
};

export type PaddleTransactionAttributes = {
  status: string;
  subscription_id: string | null;
  created_at: string;
  updated_at: string;
  payments: PaddleTransactionPayment[];
};

export type PaddleTransactionRecord = {
  id: string;
  attributes: PaddleTransactionAttributes;
};

export type PaddlePermissionProbe = {
  metricsAvailable: boolean;
  subscriptionsAvailable: boolean;
  transactionsAvailable: boolean;
};
