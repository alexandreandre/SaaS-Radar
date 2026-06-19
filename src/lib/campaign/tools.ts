import type { ConnectorId } from "@/lib/connectors/types";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";

export type MarketingProfile = "organic" | "paid-light" | "paid-scale";

export type CampaignToolCategory =
  | "strategy"
  | "visual"
  | "video"
  | "outreach"
  | "social"
  | "email"
  | "automation"
  | "ads"
  | "analytics";

export type CampaignOutputType =
  | "brief"
  | "copy"
  | "image"
  | "video"
  | "sequence"
  | "workflow"
  | "guide";

export type CampaignToolId =
  | "claude"
  | "chatgpt"
  | "canva"
  | "adcreative"
  | "higgsfield"
  | "creatify"
  | "arcads"
  | "heygen"
  | "lemlist"
  | "apollo"
  | "smartlead"
  | "typefully"
  | "buffer"
  | "loops"
  | "brevo"
  | "beehiiv"
  | "n8n";

export type DistributionTargetId =
  | "linkedin-ads"
  | "tiktok-ads"
  | "google-ads"
  | "meta-ads"
  | "plausible"
  | "posthog";

export type CampaignTool = {
  id: CampaignToolId;
  name: string;
  category: CampaignToolCategory;
  pitch: string;
  deepLink: string;
  pricingHint: string;
  outputType: CampaignOutputType;
  hasPromptTemplate: boolean;
  profiles: MarketingProfile[];
  channels: ExtendedChannelKey[];
  connectorId?: ConnectorId;
  openLabel: string;
};

export type DistributionTarget = {
  id: DistributionTargetId;
  name: string;
  category: "ads" | "analytics";
  pitch: string;
  connectorId: ConnectorId;
  channels: ExtendedChannelKey[];
  profiles: MarketingProfile[];
};

export const MARKETING_PROFILES: Record<
  MarketingProfile,
  { label: string; description: string }
> = {
  organic: {
    label: "Organique",
    description: "Contenu, email et SEO — sans budget pub.",
  },
  "paid-light": {
    label: "Pub légère",
    description: "50–200 €/mois — tests créas sur 1–2 canaux.",
  },
  "paid-scale": {
    label: "Pub scale",
    description: "200 €+ — multi-canal, UGC vidéo, volume.",
  },
};

export const CAMPAIGN_TOOLS: CampaignTool[] = [
  {
    id: "claude",
    name: "Claude",
    category: "strategy",
    pitch: "Stratégie, copy long format et voix de marque cohérente.",
    deepLink: "https://claude.ai",
    pricingHint: "dès 20 €/mois",
    outputType: "copy",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light", "paid-scale"],
    channels: ["cold_email", "linkedin", "seo", "referral", "tiktok", "meta", "google"],
    openLabel: "Ouvrir Claude",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "strategy",
    pitch: "Volume de variantes : headlines, objets email, accroches.",
    deepLink: "https://chatgpt.com",
    pricingHint: "dès 20 €/mois",
    outputType: "copy",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light", "paid-scale"],
    channels: ["cold_email", "linkedin", "seo", "referral", "tiktok", "meta", "google"],
    openLabel: "Ouvrir ChatGPT",
  },
  {
    id: "canva",
    name: "Canva",
    category: "visual",
    pitch: "Visuels social, carrousels et templates rapides.",
    deepLink: "https://www.canva.com",
    pricingHint: "Gratuit / Pro 12 €",
    outputType: "image",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light", "paid-scale"],
    channels: ["linkedin", "seo", "referral", "meta"],
    openLabel: "Ouvrir Canva",
  },
  {
    id: "adcreative",
    name: "AdCreative.ai",
    category: "visual",
    pitch: "Images ads multi-format avec scoring performance.",
    deepLink: "https://www.adcreative.ai",
    pricingHint: "dès 29 €/mois",
    outputType: "image",
    hasPromptTemplate: true,
    profiles: ["paid-light", "paid-scale"],
    channels: ["meta", "google", "tiktok", "linkedin"],
    openLabel: "Ouvrir AdCreative",
  },
  {
    id: "higgsfield",
    name: "Higgsfield",
    category: "video",
    pitch: "Suite vidéo IA — UGC, CGI et spots depuis une URL produit.",
    deepLink: "https://higgsfield.ai/marketing-studio",
    pricingHint: "dès 15 $/mois",
    outputType: "video",
    hasPromptTemplate: true,
    profiles: ["paid-light", "paid-scale"],
    channels: ["tiktok", "meta"],
    openLabel: "Ouvrir Higgsfield",
  },
  {
    id: "creatify",
    name: "Creatify",
    category: "video",
    pitch: "URL produit → vidéos UGC avatar, batch et analytics.",
    deepLink: "https://creatify.ai",
    pricingHint: "dès 39 $/mois",
    outputType: "video",
    hasPromptTemplate: true,
    profiles: ["paid-light", "paid-scale"],
    channels: ["tiktok", "meta", "google"],
    openLabel: "Ouvrir Creatify",
  },
  {
    id: "arcads",
    name: "Arcads",
    category: "video",
    pitch: "Avatars UGC ultra-réalistes pour ads performance.",
    deepLink: "https://www.arcads.ai",
    pricingHint: "dès 110 $/mois",
    outputType: "video",
    hasPromptTemplate: true,
    profiles: ["paid-scale"],
    channels: ["tiktok", "meta"],
    openLabel: "Ouvrir Arcads",
  },
  {
    id: "heygen",
    name: "HeyGen",
    category: "video",
    pitch: "Avatars studio pour explainers et démos produit B2B.",
    deepLink: "https://www.heygen.com",
    pricingHint: "dès 24 $/mois",
    outputType: "video",
    hasPromptTemplate: true,
    profiles: ["paid-light", "paid-scale"],
    channels: ["linkedin", "meta", "google"],
    openLabel: "Ouvrir HeyGen",
  },
  {
    id: "lemlist",
    name: "Lemlist",
    category: "outreach",
    pitch: "Cold email avec personnalisation et warm-up intégré.",
    deepLink: "https://www.lemlist.com",
    pricingHint: "dès 59 €/mois",
    outputType: "sequence",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light"],
    channels: ["cold_email"],
    openLabel: "Ouvrir Lemlist",
  },
  {
    id: "apollo",
    name: "Apollo",
    category: "outreach",
    pitch: "Enrichissement leads B2B et séquences multicanal.",
    deepLink: "https://www.apollo.io",
    pricingHint: "dès 59 $/mois",
    outputType: "sequence",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light", "paid-scale"],
    channels: ["cold_email", "linkedin"],
    openLabel: "Ouvrir Apollo",
  },
  {
    id: "smartlead",
    name: "Smartlead",
    category: "outreach",
    pitch: "Infrastructure cold email à volume avec délivrabilité.",
    deepLink: "https://www.smartlead.ai",
    pricingHint: "dès 39 $/mois",
    outputType: "sequence",
    hasPromptTemplate: true,
    profiles: ["paid-light", "paid-scale"],
    channels: ["cold_email"],
    openLabel: "Ouvrir Smartlead",
  },
  {
    id: "typefully",
    name: "Typefully",
    category: "social",
    pitch: "Rédaction et planification LinkedIn / X.",
    deepLink: "https://typefully.com",
    pricingHint: "dès 12 $/mois",
    outputType: "copy",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light"],
    channels: ["linkedin"],
    openLabel: "Ouvrir Typefully",
  },
  {
    id: "buffer",
    name: "Buffer",
    category: "social",
    pitch: "Planification multi-réseaux pour fondateurs solo.",
    deepLink: "https://buffer.com",
    pricingHint: "Gratuit / dès 6 $/mois",
    outputType: "workflow",
    hasPromptTemplate: false,
    profiles: ["organic", "paid-light"],
    channels: ["linkedin", "meta", "tiktok"],
    openLabel: "Ouvrir Buffer",
  },
  {
    id: "loops",
    name: "Loops",
    category: "email",
    pitch: "Email marketing pour SaaS early-stage.",
    deepLink: "https://loops.so",
    pricingHint: "Gratuit / usage",
    outputType: "sequence",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light", "paid-scale"],
    channels: ["referral", "cold_email"],
    connectorId: "loops",
    openLabel: "Ouvrir Loops",
  },
  {
    id: "brevo",
    name: "Brevo",
    category: "email",
    pitch: "Campagnes email et automation — adapté marché FR.",
    deepLink: "https://www.brevo.com",
    pricingHint: "Gratuit / dès 9 €",
    outputType: "sequence",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light", "paid-scale"],
    channels: ["cold_email", "referral"],
    connectorId: "brevo",
    openLabel: "Ouvrir Brevo",
  },
  {
    id: "beehiiv",
    name: "Beehiiv",
    category: "email",
    pitch: "Newsletter et audience pour indie founders.",
    deepLink: "https://www.beehiiv.com",
    pricingHint: "Gratuit / dès 49 $",
    outputType: "sequence",
    hasPromptTemplate: true,
    profiles: ["organic", "paid-light"],
    channels: ["referral", "seo"],
    openLabel: "Ouvrir Beehiiv",
  },
  {
    id: "n8n",
    name: "n8n",
    category: "automation",
    pitch: "Orchestration workflows — lead capture, distribution, alertes.",
    deepLink: "https://n8n.io",
    pricingHint: "Gratuit self-hosted",
    outputType: "workflow",
    hasPromptTemplate: true,
    profiles: ["paid-scale"],
    channels: ["cold_email", "linkedin", "referral", "tiktok", "meta", "google"],
    openLabel: "Ouvrir n8n",
  },
];

export const DISTRIBUTION_TARGETS: DistributionTarget[] = [
  {
    id: "linkedin-ads",
    name: "LinkedIn Ads",
    category: "ads",
    pitch: "Campagnes B2B ciblées par métier.",
    connectorId: "linkedin-ads",
    channels: ["linkedin"],
    profiles: ["paid-light", "paid-scale"],
  },
  {
    id: "tiktok-ads",
    name: "TikTok Ads",
    category: "ads",
    pitch: "UGC natif et audiences B2C niche.",
    connectorId: "tiktok-ads",
    channels: ["tiktok"],
    profiles: ["paid-light", "paid-scale"],
  },
  {
    id: "google-ads",
    name: "Google Ads",
    category: "ads",
    pitch: "Search intent et conversions.",
    connectorId: "google-ads",
    channels: ["google", "seo"],
    profiles: ["paid-light", "paid-scale"],
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    category: "ads",
    pitch: "Facebook & Instagram — retargeting et lookalike.",
    connectorId: "meta-ads",
    channels: ["meta"],
    profiles: ["paid-light", "paid-scale"],
  },
  {
    id: "plausible",
    name: "Plausible",
    category: "analytics",
    pitch: "Analytics privacy-first — signups et trafic.",
    connectorId: "plausible",
    channels: ["cold_email", "linkedin", "seo", "referral", "tiktok", "meta", "google"],
    profiles: ["organic", "paid-light", "paid-scale"],
  },
  {
    id: "posthog",
    name: "PostHog",
    category: "analytics",
    pitch: "Product analytics, funnels et rétention.",
    connectorId: "posthog",
    channels: ["cold_email", "linkedin", "seo", "referral", "tiktok", "meta", "google"],
    profiles: ["paid-light", "paid-scale"],
  },
];

const ALL_TOOL_IDS = new Set<string>(CAMPAIGN_TOOLS.map((t) => t.id));

export function isCampaignToolId(id: string): id is CampaignToolId {
  return ALL_TOOL_IDS.has(id);
}

export function getCampaignTool(id: string): CampaignTool | undefined {
  return CAMPAIGN_TOOLS.find((t) => t.id === id);
}

export function getToolsByProfile(profile: MarketingProfile): CampaignTool[] {
  return CAMPAIGN_TOOLS.filter((t) => t.profiles.includes(profile));
}

export function getToolsByChannel(
  channel: ExtendedChannelKey,
  profile?: MarketingProfile,
): CampaignTool[] {
  return CAMPAIGN_TOOLS.filter(
    (t) =>
      t.channels.includes(channel) && (!profile || t.profiles.includes(profile)),
  );
}

export function getDistributionTargetsForChannel(
  channel: ExtendedChannelKey,
  profile?: MarketingProfile,
): DistributionTarget[] {
  return DISTRIBUTION_TARGETS.filter(
    (t) =>
      t.channels.includes(channel) && (!profile || t.profiles.includes(profile)),
  );
}

export function getDistributionTarget(
  id: DistributionTargetId,
): DistributionTarget | undefined {
  return DISTRIBUTION_TARGETS.find((t) => t.id === id);
}
