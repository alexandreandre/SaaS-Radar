import type { ConnectorId } from "@/lib/connectors/types";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CampaignToolCategory, CampaignToolId, MarketingProfile } from "@/lib/campaign/tools";

export type AcquisitionStage =
  | "network"
  | "outreach"
  | "content"
  | "amplification"
  | "scale";

export type CampaignSmartGoalMetric =
  | "customers"
  | "conversations"
  | "signups"
  | "mrr";

export type CampaignSmartGoal = {
  label: string;
  metric: CampaignSmartGoalMetric;
  targetValue: number;
  horizonDays: number;
  setAt: string;
};

export type CampaignActionPhase = "prepare" | "execute" | "measure";

export type CampaignActionItem = {
  id: string;
  phase: CampaignActionPhase;
  label: string;
  detail?: string;
  toolId?: CampaignToolId;
  connectorId?: ConnectorId;
  externalUrl?: string;
  copyPayload?: string;
  done: boolean;
  doneAt?: string;
};

export type CampaignWeeklyCheckIn = {
  date: string;
  metricValue?: number;
  notes?: string;
  mood?: "on_track" | "stuck" | "pivot";
};

export type CampaignRetrospective = {
  worked: string;
  blocked: string;
  nextChange: string;
  completedAt: string;
};

export type CampaignTrackingPlan = {
  utmBase: string;
  requiredConnectors: ConnectorId[];
  configuredAt?: string;
};

export type CampaignCycleStatus = "draft" | "active" | "completed";

export type StageDefinition = {
  id: AcquisitionStage;
  label: string;
  description: string;
  customerRange: string;
  primaryMetric: string;
  allowedChannels: ExtendedChannelKey[];
  recommendedTools: CampaignToolId[];
  hiddenToolCategories: CampaignToolCategory[];
  showPaidAds: boolean;
  defaultGoal: Omit<CampaignSmartGoal, "setAt">;
};

export const ACQUISITION_STAGES: AcquisitionStage[] = [
  "network",
  "outreach",
  "content",
  "amplification",
  "scale",
];

export const STAGE_DEFINITIONS: Record<AcquisitionStage, StageDefinition> = {
  network: {
    id: "network",
    label: "Réseau",
    description: "Contactez votre réseau et les communautés où vous êtes déjà présent.",
    customerRange: "1–20 clients",
    primaryMetric: "Conversations → premiers payants",
    allowedChannels: ["linkedin", "referral", "seo"],
    recommendedTools: ["claude", "chatgpt", "typefully"],
    hiddenToolCategories: ["video", "visual"],
    showPaidAds: false,
    defaultGoal: {
      label: "10 premières conversations qualifiées",
      metric: "conversations",
      targetValue: 10,
      horizonDays: 14,
    },
  },
  outreach: {
    id: "outreach",
    label: "Outreach ciblé",
    description: "Prospection directe sur un ICP serré — email froid ou LinkedIn.",
    customerRange: "11–30 clients",
    primaryMetric: "Taux de réponse → calls → trials",
    allowedChannels: ["cold_email", "linkedin"],
    recommendedTools: ["claude", "lemlist", "apollo"],
    hiddenToolCategories: ["video"],
    showPaidAds: false,
    defaultGoal: {
      label: "5 discovery calls",
      metric: "conversations",
      targetValue: 5,
      horizonDays: 14,
    },
  },
  content: {
    id: "content",
    label: "Contenu & communauté",
    description: "Contenu fondateur, referrals et présence organique régulière.",
    customerRange: "31–60 clients",
    primaryMetric: "Signups / semaine organiques",
    allowedChannels: ["linkedin", "seo", "referral"],
    recommendedTools: ["claude", "typefully", "canva", "beehiiv"],
    hiddenToolCategories: ["video"],
    showPaidAds: false,
    defaultGoal: {
      label: "20 signups organiques",
      metric: "signups",
      targetValue: 20,
      horizonDays: 30,
    },
  },
  amplification: {
    id: "amplification",
    label: "Amplification",
    description: "Product Hunt, communautés niche et premiers tests pub légers.",
    customerRange: "61–100 clients",
    primaryMetric: "Signups / semaine",
    allowedChannels: ["linkedin", "referral", "seo", "meta", "tiktok", "google"],
    recommendedTools: ["claude", "creatify", "canva", "adcreative"],
    hiddenToolCategories: [],
    showPaidAds: true,
    defaultGoal: {
      label: "30 signups en 30 jours",
      metric: "signups",
      targetValue: 30,
      horizonDays: 30,
    },
  },
  scale: {
    id: "scale",
    label: "Scale pub",
    description: "Pub structurée multi-canal — suivez le ROAS dans Acquisition.",
    customerRange: "100+ clients",
    primaryMetric: "ROAS / CAC",
    allowedChannels: ["cold_email", "linkedin", "seo", "referral", "meta", "tiktok", "google"],
    recommendedTools: ["claude", "adcreative", "creatify", "higgsfield"],
    hiddenToolCategories: [],
    showPaidAds: true,
    defaultGoal: {
      label: "ROAS positif sur 1 canal",
      metric: "customers",
      targetValue: 10,
      horizonDays: 30,
    },
  },
};

export function getStageDefinition(stage: AcquisitionStage): StageDefinition {
  return STAGE_DEFINITIONS[stage];
}

export function profileFromStage(stage: AcquisitionStage): MarketingProfile {
  if (stage === "network" || stage === "outreach" || stage === "content") return "organic";
  if (stage === "amplification") return "paid-light";
  return "paid-scale";
}

export function stageFromLegacyProfile(
  profile: MarketingProfile,
  channel?: ExtendedChannelKey,
): AcquisitionStage {
  if (profile === "paid-scale") return "scale";
  if (profile === "paid-light") return "amplification";
  if (channel === "cold_email") return "outreach";
  return "network";
}

export function isChannelAllowedForStage(
  stage: AcquisitionStage,
  channel: ExtendedChannelKey,
): boolean {
  return STAGE_DEFINITIONS[stage].allowedChannels.includes(channel);
}

export function isToolCategoryHiddenForStage(
  stage: AcquisitionStage,
  category: CampaignToolCategory,
): boolean {
  return STAGE_DEFINITIONS[stage].hiddenToolCategories.includes(category);
}

export function defaultSmartGoalForStage(stage: AcquisitionStage): CampaignSmartGoal {
  const def = STAGE_DEFINITIONS[stage].defaultGoal;
  return { ...def, setAt: new Date().toISOString() };
}
