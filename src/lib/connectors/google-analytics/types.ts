export type GoogleAnalyticsCredential = {
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  propertyId?: string;
  propertyDisplayName?: string;
  signupEvent?: string | null;
  trialEvent?: string | null;
};

export type GaPropertySummary = {
  propertyId: string;
  displayName: string;
  accountDisplayName: string;
};

export type GaRunReportRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

export type GaRunReportResponse = {
  rows?: GaRunReportRow[];
  dimensionHeaders?: Array<{ name?: string }>;
  metricHeaders?: Array<{ name?: string }>;
  rowCount?: number;
};

export type GaBatchRunReportsResponse = {
  reports?: GaRunReportResponse[];
};

export type GaAccountSummary = {
  displayName?: string;
  propertySummaries?: Array<{
    property?: string;
    displayName?: string;
    propertyType?: string;
  }>;
};

export type GaAccountSummariesListResponse = {
  accountSummaries?: GaAccountSummary[];
  nextPageToken?: string;
};

export type GaEventSummary = {
  name: string;
  count: number;
};
