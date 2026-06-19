export type FreemiusCredential = {
  productId: string;
  apiToken: string;
  productTitle: string;
  currency: string;
  sandbox: boolean;
};

export type FreemiusAccountMeta = {
  accountLabel: string;
  productId: string;
  currency: string;
  sandbox: boolean;
};

export type FreemiusProductSummary = {
  id: string;
  title: string;
  slug: string;
  sandbox: boolean;
};

export type FreemiusSubscriptionRecord = {
  id: string;
  user_id: string;
  created: string;
  canceled_at: string | null;
  next_payment: string | null;
  trial_ends: string | null;
  renewal_amount: number | string;
  amount_per_cycle: number | string;
  billing_cycle: number;
  currency: string;
  failed_payments: number | string;
  outstanding_balance: number | string;
};

export type FreemiusListSubscriptionsResponse = {
  subscriptions: FreemiusSubscriptionRecord[];
};

export type FreemiusProductResponse = {
  id: string;
  title: string;
  slug: string;
  environment: number;
};
