export type SentryCredential = {
  installationId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  organizationSlug: string;
  organizationId?: string;
  sentryProjectId?: string;
  sentryProjectSlug?: string;
  projectName?: string;
  apiHost: string;
};

export type SentryProjectSummary = {
  id: string;
  slug: string;
  name: string;
  platform?: string;
};

export type SentryOrganizationSummary = {
  id: string;
  slug: string;
  name: string;
};

export type SentryInstallationDetails = {
  uuid: string;
  organization?: {
    slug: string;
    id?: string;
    name?: string;
  };
  status?: string;
};

export type SentryAuthTokenResponse = {
  id?: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  dateCreated?: string;
};

export type SentryRelease = {
  id?: number | string;
  version?: string;
  dateCreated?: string;
  deployCount?: number;
};

export type SentrySyncMetrics = {
  openIssues: number;
  errorRate: number;
  uptimePct: number;
  deploysLast30d: number;
  releasesAvailable: boolean;
};

export type SentryConnectInput = {
  sentryProjectId: string;
  sentryProjectSlug?: string;
  projectName?: string;
};
