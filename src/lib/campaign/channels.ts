import {
  resolveChannelKey as resolveLegacyChannelKey,
  type AcquisitionChannelKey,
} from "@/lib/acquisition-channels";

export type { AcquisitionChannelKey };

export type ExtendedChannelKey =
  | AcquisitionChannelKey
  | "tiktok"
  | "meta"
  | "google";

const EXTENDED_ALIASES: Record<string, ExtendedChannelKey> = {
  tiktok: "tiktok",
  "tiktok ads": "tiktok",
  meta: "meta",
  "meta ads": "meta",
  facebook: "meta",
  instagram: "meta",
  google: "google",
  "google ads": "google",
};

export function resolveExtendedChannelKey(title: string): ExtendedChannelKey {
  const lower = title.toLowerCase().trim();
  if (EXTENDED_ALIASES[lower]) return EXTENDED_ALIASES[lower];
  for (const [alias, key] of Object.entries(EXTENDED_ALIASES)) {
    if (lower.includes(alias)) return key;
  }
  return resolveLegacyChannelKey(title);
}

export const CHANNEL_LABELS: Record<ExtendedChannelKey, string> = {
  cold_email: "Cold email",
  linkedin: "LinkedIn",
  seo: "SEO",
  referral: "Recommandation",
  tiktok: "TikTok Ads",
  meta: "Meta Ads",
  google: "Google Ads",
};

export function getChannelLabel(key: ExtendedChannelKey): string {
  return CHANNEL_LABELS[key] ?? key;
}
