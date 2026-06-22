import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { CampaignSetup } from "@/lib/campaign/kits";

export type GtmEngine = "demand" | "capture";

export type GtmMotion =
  | "founder_led"
  | "outbound"
  | "content"
  | "paid_test"
  | "launch";

export const GTM_ENGINE_LABELS: Record<GtmEngine, string> = {
  demand: "Créer la demande (95 %)",
  capture: "Capter la demande (5 %)",
};

export const GTM_MOTION_LABELS: Record<GtmMotion, string> = {
  founder_led: "Founder-led (réseau & communautés)",
  outbound: "Outbound multicanal",
  content: "Contenu & AEO",
  paid_test: "Tests pub payante",
  launch: "Lancement (PH / HN)",
};

const STAGE_ENGINE: Record<AcquisitionStage, GtmEngine> = {
  network: "capture",
  outreach: "capture",
  content: "demand",
  amplification: "demand",
  scale: "capture",
};

const STAGE_DEFAULT_MOTION: Record<AcquisitionStage, GtmMotion> = {
  network: "founder_led",
  outreach: "outbound",
  content: "content",
  amplification: "launch",
  scale: "paid_test",
};

const CHANNEL_MOTION: Partial<Record<ExtendedChannelKey, GtmMotion>> = {
  linkedin: "founder_led",
  cold_email: "outbound",
  seo: "content",
  referral: "founder_led",
  meta: "paid_test",
  google: "paid_test",
  tiktok: "paid_test",
};

export function getDominantGtmEngine(stage: AcquisitionStage): GtmEngine {
  return STAGE_ENGINE[stage];
}

export function recommendGtmMotion(
  stage: AcquisitionStage,
  channel: ExtendedChannelKey,
  setup?: CampaignSetup,
): GtmMotion {
  if (setup?.gtmMotion) return setup.gtmMotion;
  return CHANNEL_MOTION[channel] ?? STAGE_DEFAULT_MOTION[stage];
}

export function resolveGtmEngineFocus(
  stage: AcquisitionStage,
  setup?: CampaignSetup,
): GtmEngine {
  return setup?.gtmEngineFocus ?? getDominantGtmEngine(stage);
}
