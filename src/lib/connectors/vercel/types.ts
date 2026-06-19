export type VercelCredential = {
  accessToken: string;
  teamId?: string | null;
  userId?: string | null;
  vercelProjectId?: string | null;
  projectName?: string | null;
};

export type VercelOAuthState = {
  projectId: string;
  userId: string;
  returnTo?: "build" | "integrations";
};

export type VercelProjectSummary = {
  id: string;
  name: string;
  repo?: string;
};

export type VercelDeployment = {
  uid: string;
  url: string;
  state: string;
  readyState?: string;
  createdAt: number;
};

export type VercelDeployMetrics = {
  projectId: string;
  projectName: string;
  productionUrl: string;
  lastDeploymentState: string;
  lastDeploymentAt: string | null;
  deploysLast30d: number;
  uptimePct: number;
  infraCostMonthly: number;
  billingAvailable: boolean;
};

export type VercelSyncConnection = {
  provider: "vercel";
  projectId: string;
  projectName: string;
  productionUrl?: string;
  connectedAt: string;
};
