export type AbbyRevenueSource = "billing_list" | "billing_statistics" | "unavailable";

export type AbbyCredential = {
  apiKey: string;
  companyId?: string;
  commercialName?: string;
};

export type AbbyAccountMeta = {
  accountLabel: string;
  companyId: string;
  commercialName: string;
};

export type AbbyCompanyDto = {
  id?: string;
  commercialName?: string;
  name?: string;
};

export type AbbyReadMeResponse = {
  company?: AbbyCompanyDto;
  user?: {
    firstname?: string;
    lastname?: string;
  };
};

export type AbbyPurchaseRegisterItem = {
  id: string;
  amount: number;
  vatAmount: number;
  emittedAt?: string;
};

export type AbbyPurchaseRegisterListResponse = {
  docs: AbbyPurchaseRegisterItem[];
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  nextPage?: number | null;
};

export type AbbyPurchaseRegisterStatistics = {
  withoutTax: number;
  totalTax: number;
};

export type AbbyBillingCollectionItem = {
  id: string;
  type?: string;
  state?: string;
  emittedAt?: number | null;
  paidAt?: number | null;
  totalAmountWithoutTaxAfterDiscount?: number;
  totalAmountWithTaxAfterDiscount?: number;
};

export type AbbyBillingCollectionResponse = {
  docs: AbbyBillingCollectionItem[];
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  nextPage?: number | null;
};

export type AbbyBillingStatistics = {
  amountPaidWithoutTax: number;
  amountPaidTotalTax: number;
  amountWithoutFilterWithoutTax?: number;
  amountWithoutFilterTotalTax?: number;
};

export type AbbySyncMetadata = {
  revenueSource: AbbyRevenueSource;
  revenueUnavailable?: boolean;
};
