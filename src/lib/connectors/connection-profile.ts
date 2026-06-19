import type { ConnectorId, Integration } from "@/lib/connectors/types";

export type ConnectDialogId =
  | "stripe"
  | "google-ads"
  | "meta-ads"
  | "tiktok-ads"
  | "linkedin-ads"
  | "microsoft-ads"
  | "plausible"
  | "loops"
  | "brevo"
  | "resend"
  | "crisp"
  | "vercel"
  | "github"
  | "lemon-squeezy"
  | "paddle"
  | "freemius"
  | "posthog"
  | "mixpanel"
  | "google-analytics"
  | "intercom"
  | "fathom"
  | "zendesk"
  | "qonto"
  | "pennylane"
  | "abby"
  | "better-stack"
  | "sentry"
  | "slack"
  | "hubspot"
  | "pipedrive";

export type ConnectorConnectionProfile = {
  supportsReal: boolean;
  supportsDemo: boolean;
  connectDialog?: ConnectDialogId;
};

export type IntegrationDisplayStatus = "connected" | "demo" | "idle";

const REAL_ONLY: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "stripe",
};

const REAL_ONLY_GOOGLE_ADS: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "google-ads",
};

const REAL_ONLY_META_ADS: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "meta-ads",
};

const REAL_ONLY_TIKTOK_ADS: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "tiktok-ads",
};

const REAL_ONLY_LINKEDIN_ADS: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "linkedin-ads",
};

const REAL_ONLY_MICROSOFT_ADS: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "microsoft-ads",
};

const REAL_ONLY_PLAUSIBLE: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "plausible",
};

const REAL_ONLY_LOOPS: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "loops",
};

const REAL_ONLY_BREVO: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "brevo",
};

const REAL_ONLY_RESEND: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "resend",
};

const REAL_ONLY_CRISP: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "crisp",
};

const REAL_ONLY_VERCEL: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "vercel",
};

const REAL_ONLY_GITHUB: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "github",
};

const REAL_ONLY_LEMON_SQUEEZY: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "lemon-squeezy",
};

const DEMO_ONLY: ConnectorConnectionProfile = {
  supportsReal: false,
  supportsDemo: true,
};

const REAL_ONLY_PADDLE: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "paddle",
};

const REAL_ONLY_FREEMIUS: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "freemius",
};

const REAL_ONLY_GOOGLE_ANALYTICS: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "google-analytics",
};

const REAL_ONLY_POSTHOG: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "posthog",
};

const REAL_ONLY_MIXPANEL: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "mixpanel",
};

const REAL_ONLY_FATHOM: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "fathom",
};

const REAL_ONLY_INTERCOM: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "intercom",
};

const REAL_ONLY_ZENDESK: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "zendesk",
};

const REAL_ONLY_QONTO: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "qonto",
};

const REAL_ONLY_PENNYLANE: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "pennylane",
};

const REAL_ONLY_ABBY: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: false,
  connectDialog: "abby",
};

const REAL_AND_DEMO_BETTER_STACK: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: true,
  connectDialog: "better-stack",
};

const REAL_ONLY_SLACK: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: true,
  connectDialog: "slack",
};

const REAL_AND_DEMO_HUBSPOT: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: true,
  connectDialog: "hubspot",
};

const REAL_AND_DEMO_SENTRY: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: true,
  connectDialog: "sentry",
};

const REAL_AND_DEMO_PIPEDRIVE: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: true,
  connectDialog: "pipedrive",
};

const PROFILES: Partial<Record<ConnectorId, ConnectorConnectionProfile>> = {
  stripe: REAL_ONLY,
  "google-ads": REAL_ONLY_GOOGLE_ADS,
  "meta-ads": REAL_ONLY_META_ADS,
  "tiktok-ads": REAL_ONLY_TIKTOK_ADS,
  "linkedin-ads": REAL_ONLY_LINKEDIN_ADS,
  "microsoft-ads": REAL_ONLY_MICROSOFT_ADS,
  plausible: REAL_ONLY_PLAUSIBLE,
  loops: REAL_ONLY_LOOPS,
  brevo: REAL_ONLY_BREVO,
  resend: REAL_ONLY_RESEND,
  crisp: REAL_ONLY_CRISP,
  vercel: REAL_ONLY_VERCEL,
  github: REAL_ONLY_GITHUB,
  "lemon-squeezy": REAL_ONLY_LEMON_SQUEEZY,
  paddle: REAL_ONLY_PADDLE,
  freemius: REAL_ONLY_FREEMIUS,
  posthog: REAL_ONLY_POSTHOG,
  mixpanel: REAL_ONLY_MIXPANEL,
  "google-analytics": REAL_ONLY_GOOGLE_ANALYTICS,
  intercom: REAL_ONLY_INTERCOM,
  fathom: REAL_ONLY_FATHOM,
  zendesk: REAL_ONLY_ZENDESK,
  qonto: REAL_ONLY_QONTO,
  pennylane: REAL_ONLY_PENNYLANE,
  abby: REAL_ONLY_ABBY,
  "better-stack": REAL_AND_DEMO_BETTER_STACK,
  sentry: REAL_AND_DEMO_SENTRY,
  slack: REAL_ONLY_SLACK,
  hubspot: REAL_AND_DEMO_HUBSPOT,
  pipedrive: REAL_AND_DEMO_PIPEDRIVE,
};

export function getConnectorConnectionProfile(id: ConnectorId): ConnectorConnectionProfile {
  return PROFILES[id] ?? DEMO_ONLY;
}

export function getIntegrationDisplayStatus(
  integration: Integration | undefined,
): IntegrationDisplayStatus {
  if (integration?.status === "connected") return "connected";
  if (integration?.status === "demo") {
    const profile = getConnectorConnectionProfile(integration.connectorId);
    if (profile.supportsDemo) return "demo";
  }
  return "idle";
}

export function isIntegrationActive(status: IntegrationDisplayStatus): boolean {
  return status === "connected" || status === "demo";
}
