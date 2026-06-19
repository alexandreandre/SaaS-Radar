export type PennylaneAuthType = "company_token" | "oauth";

export type PennylaneCompanyTokenCredential = {
  authType: "company_token";
  apiToken: string;
  companyId?: number;
  companyName?: string;
};

export type PennylaneOAuthCredential = {
  authType: "oauth";
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  companyId?: number;
  companyName?: string;
};

export type PennylaneCredential = PennylaneCompanyTokenCredential | PennylaneOAuthCredential;

export type PennylaneMeResponse = {
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    locale?: string;
  };
  company?: {
    id: number;
    name: string;
    reg_no?: string;
  };
  scopes?: string[];
};

export type PennylaneTrialBalanceItem = {
  number: string;
  formatted_number: string;
  label: string;
  debits: string;
  credits: string;
};

export type PennylaneTrialBalanceResponse = {
  items: PennylaneTrialBalanceItem[];
  has_more?: boolean | null;
  next_cursor?: string | null;
};

export type PennylaneCustomerInvoice = {
  id: number;
  date?: string;
  currency_amount?: string;
  currency_amount_before_tax?: string;
  draft?: boolean;
  credit_note?: boolean;
};

export type PennylaneCustomerInvoicesResponse = {
  items?: PennylaneCustomerInvoice[];
  has_more?: boolean | null;
  next_cursor?: string | null;
};

export type PennylaneSupplierInvoice = {
  id: number;
  date?: string;
  currency_amount?: string;
  currency_amount_before_tax?: string;
  draft?: boolean;
};

export type PennylaneSupplierInvoicesResponse = {
  items?: PennylaneSupplierInvoice[];
  has_more?: boolean | null;
  next_cursor?: string | null;
};

export type PennylaneTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

export type PennylaneAccountMeta = {
  accountLabel: string;
  companyId: number;
  companyName: string;
  scopes: string[];
  sandbox: boolean;
  hasTrialBalanceScope: boolean;
};
