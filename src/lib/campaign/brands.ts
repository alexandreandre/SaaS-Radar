import type { CampaignToolId } from "@/lib/campaign/tools";
import type { ConnectorId } from "@/lib/connectors/types";

export type CampaignBrandSimpleIcon = {
  source: "simple-icon";
  icon: "SiClaude";
  color: string;
};

export type CampaignBrandFavicon = {
  source: "favicon";
  domain: string;
  fallbackColor?: string;
};

export type CampaignBrandConnector = {
  source: "connector";
  connectorId: ConnectorId;
};

export type CampaignBrand =
  | CampaignBrandSimpleIcon
  | CampaignBrandFavicon
  | CampaignBrandConnector;

export const CAMPAIGN_TOOL_BRANDS: Partial<Record<CampaignToolId, CampaignBrand>> = {
  claude: { source: "simple-icon", icon: "SiClaude", color: "#D97757" },
  chatgpt: { source: "favicon", domain: "openai.com", fallbackColor: "#412991" },
  canva: { source: "favicon", domain: "canva.com", fallbackColor: "#00C4CC" },
  adcreative: { source: "favicon", domain: "adcreative.ai", fallbackColor: "#6366F1" },
  higgsfield: { source: "favicon", domain: "higgsfield.ai", fallbackColor: "#8B5CF6" },
  creatify: { source: "favicon", domain: "creatify.ai", fallbackColor: "#EC4899" },
  arcads: { source: "favicon", domain: "arcads.ai", fallbackColor: "#F97316" },
  heygen: { source: "favicon", domain: "heygen.com", fallbackColor: "#2563EB" },
  lemlist: { source: "favicon", domain: "lemlist.com", fallbackColor: "#7C3AED" },
  apollo: { source: "favicon", domain: "apollo.io", fallbackColor: "#FBBF24" },
  smartlead: { source: "favicon", domain: "smartlead.ai", fallbackColor: "#0EA5E9" },
  typefully: { source: "favicon", domain: "typefully.com", fallbackColor: "#18181B" },
  buffer: { source: "favicon", domain: "buffer.com", fallbackColor: "#231F20" },
  loops: { source: "connector", connectorId: "loops" },
  brevo: { source: "connector", connectorId: "brevo" },
  beehiiv: { source: "favicon", domain: "beehiiv.com", fallbackColor: "#FFD700" },
  n8n: { source: "favicon", domain: "n8n.io", fallbackColor: "#EA4B71" },
};

export const CAMPAIGN_TOOL_FALLBACK_COLORS: Partial<Record<CampaignToolId, string>> = {
  claude: "#D97757",
  chatgpt: "#412991",
  canva: "#00C4CC",
};
