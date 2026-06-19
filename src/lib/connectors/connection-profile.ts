import type { ConnectorId, Integration } from "@/lib/connectors/types";

export type ConnectDialogId =
  | "stripe"
  | "google-ads"
  | "meta-ads"
  | "tiktok-ads"
  | "linkedin-ads"
  | "plausible"
  | "loops"
  | "brevo"
  | "crisp"
  | "vercel"
  | "github"
  | "lemon-squeezy";

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

const REAL_AND_DEMO_BREVO: ConnectorConnectionProfile = {
  supportsReal: true,
  supportsDemo: true,
  connectDialog: "brevo",
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

const PROFILES: Partial<Record<ConnectorId, ConnectorConnectionProfile>> = {
  stripe: REAL_ONLY,
  "google-ads": REAL_ONLY_GOOGLE_ADS,
  "meta-ads": REAL_ONLY_META_ADS,
  "tiktok-ads": REAL_ONLY_TIKTOK_ADS,
  "linkedin-ads": REAL_ONLY_LINKEDIN_ADS,
  plausible: REAL_ONLY_PLAUSIBLE,
  loops: REAL_ONLY_LOOPS,
  brevo: REAL_AND_DEMO_BREVO,
  crisp: REAL_ONLY_CRISP,
  vercel: REAL_ONLY_VERCEL,
  github: REAL_ONLY_GITHUB,
  "lemon-squeezy": REAL_ONLY_LEMON_SQUEEZY,
};

export function getConnectorConnectionProfile(id: ConnectorId): ConnectorConnectionProfile {
  return PROFILES[id] ?? DEMO_ONLY;
}

export function getIntegrationDisplayStatus(
  integration: Integration | undefined,
): IntegrationDisplayStatus {
  if (integration?.status === "connected") return "connected";
  if (
    integration?.status === "demo" &&
    integration.connectorId !== "google-ads" &&
    integration.connectorId !== "meta-ads" &&
    integration.connectorId !== "tiktok-ads" &&
    integration.connectorId !== "linkedin-ads"
  ) {
    return "demo";
  }
  return "idle";
}

export function isIntegrationActive(status: IntegrationDisplayStatus): boolean {
  return status === "connected" || status === "demo";
}
