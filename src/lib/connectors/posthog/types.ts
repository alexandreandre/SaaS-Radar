export type PostHogCredential = {
  personalApiKey: string;
  projectId: string;
  appHost: string;
  signupEvent?: string | null;
  activationEvent?: string | null;
};

export type PostHogAccountMeta = {
  accountLabel: string;
  projectName?: string;
  timezone?: string;
  hasSignupEvent: boolean;
  hasActivationEvent: boolean;
};

export type PostHogProjectSummary = {
  id: string;
  name: string;
  timezone?: string;
};

export type PostHogEventDefinition = {
  name: string;
  lastSeenAt?: string | null;
};

export type HogQLQueryResponse = {
  results?: unknown[][];
  columns?: string[];
  types?: string[];
  query_status?: {
    id?: string;
    complete?: boolean;
  };
};

export type HogQLQueryRow = {
  month: string;
  value: number;
};
