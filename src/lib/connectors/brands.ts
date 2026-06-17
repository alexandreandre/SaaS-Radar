import type { ConnectorBrand, ConnectorId } from "@/lib/connectors/types";

export const CONNECTOR_BRANDS: Record<ConnectorId, ConnectorBrand> = {
  stripe: { icon: "SiStripe", source: "simple-icons", color: "#635BFF" },
  "lemon-squeezy": { icon: "SiLemonsqueezy", source: "simple-icons", color: "#FFC233" },
  paddle: { icon: "SiPaddle", source: "simple-icons", color: "#FDDD35" },
  freemius: { icon: "freemius", source: "local", color: "#0073AA" },
  "google-ads": { icon: "SiGoogleads", source: "simple-icons", color: "#4285F4" },
  "meta-ads": { icon: "SiMeta", source: "simple-icons", color: "#0081FB" },
  "linkedin-ads": { icon: "linkedin-ads", source: "local", color: "#0A66C2" },
  "tiktok-ads": { icon: "SiTiktok", source: "simple-icons", color: "#000000" },
  "microsoft-ads": { icon: "microsoft-ads", source: "local", color: "#0078D4" },
  plausible: { icon: "SiPlausibleanalytics", source: "simple-icons", color: "#5850EC" },
  "google-analytics": { icon: "SiGoogleanalytics", source: "simple-icons", color: "#E37400" },
  posthog: { icon: "SiPosthog", source: "simple-icons", color: "#F54E00" },
  mixpanel: { icon: "SiMixpanel", source: "simple-icons", color: "#7856FF" },
  fathom: { icon: "SiFathom", source: "simple-icons", color: "#9187FF" },
  brevo: { icon: "SiBrevo", source: "simple-icons", color: "#0B996E" },
  resend: { icon: "SiResend", source: "simple-icons", color: "#000000" },
  loops: { icon: "loops", source: "local", color: "#FF5C35" },
  crisp: { icon: "crisp", source: "local", color: "#007AFF" },
  intercom: { icon: "SiIntercom", source: "simple-icons", color: "#1F8DED" },
  zendesk: { icon: "SiZendesk", source: "simple-icons", color: "#03363D" },
  qonto: { icon: "qonto", source: "local", color: "#6C5CE7" },
  pennylane: { icon: "pennylane", source: "local", color: "#0066FF" },
  abby: { icon: "abby", source: "local", color: "#6366F1" },
  github: { icon: "SiGithub", source: "simple-icons", color: "#181717" },
  vercel: { icon: "SiVercel", source: "simple-icons", color: "#000000" },
  sentry: { icon: "SiSentry", source: "simple-icons", color: "#362D59" },
  "better-stack": { icon: "SiBetterstack", source: "simple-icons", color: "#003EFF" },
  slack: { icon: "slack", source: "local", color: "#4A154B" },
  hubspot: { icon: "SiHubspot", source: "simple-icons", color: "#FF7A59" },
  pipedrive: { icon: "pipedrive", source: "local", color: "#017737" },
};

export function getConnectorBrand(id: ConnectorId): ConnectorBrand {
  return CONNECTOR_BRANDS[id];
}
