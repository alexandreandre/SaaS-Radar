import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { MarketingProfile } from "@/lib/campaign/tools";
import { resolveSequenceId } from "@/lib/campaign/sequences";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";

export function parseMarketingProfile(raw: unknown): MarketingProfile | null {
  if (raw === "organic" || raw === "paid-light" || raw === "paid-scale") return raw;
  return null;
}

export function parseAcquisitionStage(raw: unknown): AcquisitionStage | null {
  const valid: AcquisitionStage[] = [
    "network",
    "outreach",
    "content",
    "amplification",
    "scale",
  ];
  if (typeof raw === "string" && valid.includes(raw as AcquisitionStage)) {
    return raw as AcquisitionStage;
  }
  return null;
}

export function parseChannelKey(raw: unknown): ExtendedChannelKey | null {
  const valid: ExtendedChannelKey[] = [
    "cold_email",
    "linkedin",
    "seo",
    "referral",
    "tiktok",
    "meta",
    "google",
  ];
  if (typeof raw === "string" && valid.includes(raw as ExtendedChannelKey)) {
    return raw as ExtendedChannelKey;
  }
  return null;
}

export function resolveSequenceForPlan(
  stage: AcquisitionStage,
  channel: ExtendedChannelKey,
): string {
  const motion = recommendGtmMotion(stage, channel);
  return resolveSequenceId(stage, channel, motion);
}
