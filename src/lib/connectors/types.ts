export type ConnectorId =
  | "stripe"
  | "lemon-squeezy"
  | "paddle"
  | "freemius"
  | "google-ads"
  | "meta-ads"
  | "linkedin-ads"
  | "tiktok-ads"
  | "microsoft-ads"
  | "plausible"
  | "google-analytics"
  | "posthog"
  | "mixpanel"
  | "fathom"
  | "brevo"
  | "resend"
  | "loops"
  | "crisp"
  | "intercom"
  | "zendesk"
  | "qonto"
  | "pennylane"
  | "abby"
  | "github"
  | "vercel"
  | "sentry"
  | "better-stack"
  | "slack"
  | "hubspot"
  | "pipedrive";

export type ConnectorCategory =
  | "payments"
  | "ads"
  | "analytics"
  | "email"
  | "support"
  | "finance"
  | "accounting"
  | "dev"
  | "monitoring"
  | "communication"
  | "crm";

export type ConnectorPriority = "p0" | "p1" | "p2";

export type MetricKey =
  | "mrr"
  | "newMrr"
  | "expansionMrr"
  | "churnedMrr"
  | "customers"
  | "signups"
  | "trials"
  | "activeUsers"
  | "mau"
  | "dau"
  | "adSpend"
  | "impressions"
  | "clicks"
  | "conversions";

export type MetricsSnapshot = {
  date: string;
  mrr: number;
  newMrr: number;
  expansionMrr: number;
  churnedMrr: number;
  customers: number;
  arr?: number;
  signups: number;
  trials: number;
  activeUsers: number;
  mau: number;
  dau: number;
  adSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  source?: ConnectorId | "manual";
};

export type AdChannel =
  | "google"
  | "meta"
  | "linkedin"
  | "tiktok"
  | "microsoft"
  | "other";

export type AdCampaign = {
  id: string;
  channel: AdChannel;
  name: string;
  status: "active" | "paused" | "ended";
  dailyBudget: number;
  totalSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startedAt: string;
};

export type ExpenseCategory = "infra" | "ads" | "tools" | "salary" | "other";

export type Expense = {
  id: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  recurring: boolean;
  date: string;
};

export type Integration = {
  connectorId: ConnectorId;
  status: "demo" | "connected" | "disconnected";
  connectedAt?: string;
  lastSyncAt?: string;
  accountLabel?: string;
  lastError?: string;
  syncSchedule?: "manual" | "daily";
};

export type ConnectorDefinition = {
  id: ConnectorId;
  name: string;
  category: ConnectorCategory;
  description: string;
  provides: MetricKey[];
  jobLabel: string;
  impactOnPromise?: string;
  recommendedFor?: string[];
  priority: ConnectorPriority;
  demo: (seed: string, months: number, targetMrr: number) => MetricsSnapshot[];
};

export type DemoSyncContext = {
  projectId: string;
  targetMrr: number;
  months?: number;
};

/** Future OAuth/API sync contract — not implemented yet. */
export type OAuthConfig = {
  authUrl: string;
  scopes: string[];
  redirectUri: string;
};

export type ConnectorSyncResult = {
  snapshots?: MetricsSnapshot[];
  stream?: import("@/lib/connectors/streams").ConnectorStreamPayload;
  accountLabel?: string;
  syncedAt: string;
};
