export type MicrosoftAdsIdentityProvider = "Microsoft" | "Google";

export type MicrosoftAdsCredential = {
  identityProvider: MicrosoftAdsIdentityProvider;
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  userId?: string;
  customerId?: string;
  accountId?: string;
  accountName?: string;
  currencyCode?: string;
};

export type MicrosoftAdsAccountSummary = {
  accountId: string;
  customerId: string;
  name: string;
  currencyCode?: string;
  accountNumber?: string;
};

export type MicrosoftAdsReportRow = {
  timePeriod?: string;
  spend?: string | number;
  impressions?: string | number;
  clicks?: string | number;
  conversions?: string | number;
  conversionsQualified?: string | number;
};

export type MicrosoftAdsDatePart = {
  day: number;
  month: number;
  year: number;
};

export type MicrosoftAdsReportDateRange = {
  startDay: number;
  startMonth: number;
  startYear: number;
  endDay: number;
  endMonth: number;
  endYear: number;
};

export type MicrosoftAdsGetUserResponse = {
  User?: {
    Id?: string;
    CustomerId?: string;
    UserName?: string;
  };
  CustomerRoles?: Array<{
    CustomerId?: string;
    AccountIds?: string[];
  }>;
};

export type MicrosoftAdsSearchAccountsResponse = {
  Accounts?: Array<{
    Id?: string;
    Name?: string;
    Number?: string;
    ParentCustomerId?: string;
    CurrencyCode?: string;
    AccountLifeCycleStatus?: string;
  }>;
};

export type MicrosoftAdsSubmitReportResponse = {
  ReportRequestId?: string;
};

export type MicrosoftAdsPollReportResponse = {
  ReportRequestStatus?: {
    Status?: string;
    ReportDownloadUrl?: string;
  };
};
