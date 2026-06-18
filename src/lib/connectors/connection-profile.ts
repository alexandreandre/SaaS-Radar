import type { ConnectorId, Integration } from "@/lib/connectors/types";

export type ConnectDialogId = "stripe" | "google-ads" | "meta-ads";

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

const DEMO_ONLY: ConnectorConnectionProfile = {
  supportsReal: false,
  supportsDemo: true,
};

const PROFILES: Partial<Record<ConnectorId, ConnectorConnectionProfile>> = {
  stripe: REAL_ONLY,
  "google-ads": REAL_ONLY_GOOGLE_ADS,
  "meta-ads": REAL_ONLY_META_ADS,
};

export function getConnectorConnectionProfile(id: ConnectorId): ConnectorConnectionProfile {
  return PROFILES[id] ?? DEMO_ONLY;
}

export function getIntegrationDisplayStatus(
  integration: Integration | undefined,
): IntegrationDisplayStatus {
  if (integration?.status === "connected") return "connected";
  if (integration?.status === "demo" && integration.connectorId !== "google-ads" && integration.connectorId !== "meta-ads") return "demo";
  return "idle";
}

export function isIntegrationActive(status: IntegrationDisplayStatus): boolean {
  return status === "connected" || status === "demo";
}
