export type QontoEnvironment = "production" | "sandbox";

export type QontoCredential = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  environment?: QontoEnvironment;
};

export type QontoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export type QontoBankAccount = {
  id: string;
  name?: string;
  status?: string;
  main?: boolean;
  iban?: string;
  balance_cents?: number;
  authorized_balance_cents?: number;
  is_external_account?: boolean;
  currency?: string;
};

export type QontoOrganization = {
  id: string;
  name: string;
  slug: string;
  legal_name?: string | null;
  bank_accounts?: QontoBankAccount[];
};

export type QontoOrganizationResponse = {
  organization: QontoOrganization;
};

export type QontoTransaction = {
  id: string;
  side?: "credit" | "debit";
  amount_cents?: number;
  status?: string;
  settled_at?: string | null;
  emitted_at?: string;
  updated_at?: string;
};

export type QontoTransactionsMeta = {
  current_page?: number;
  next_page?: number | null;
  prev_page?: number | null;
  total_pages?: number;
  total_count?: number;
};

export type QontoTransactionsResponse = {
  transactions: QontoTransaction[];
  meta?: QontoTransactionsMeta;
};

export type QontoApiError = {
  errors?: Array<{ code?: string; detail?: string; message?: string }>;
};
