export type MixpanelRegion = "us" | "eu" | "in";

export type MixpanelCredential = {
  serviceAccountUsername: string;
  serviceAccountSecret: string;
  projectId: string;
  region: MixpanelRegion;
  workspaceId?: string | null;
  projectLabel?: string | null;
  signupEvent?: string | null;
  activationEvent?: string | null;
  activityEvent?: string | null;
};

export type MixpanelAccountMeta = {
  accountLabel: string;
  projectLabel?: string;
  region: MixpanelRegion;
  hasSignupEvent: boolean;
  hasActivationEvent: boolean;
  hasActivityEvent: boolean;
};

export type MixpanelEventDefinition = {
  name: string;
};

export type SegmentationQueryResponse = {
  data?: {
    series?: string[];
    values?: Record<string, Record<string, number>>;
  };
  error?: string;
};

export type RetentionCohortRow = {
  counts?: number[];
  first?: number;
};

export type RetentionQueryResponse = Record<string, RetentionCohortRow>;

export type MixpanelMeResponse = {
  results?: {
    email?: string;
    name?: string;
  };
};
