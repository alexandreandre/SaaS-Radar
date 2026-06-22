import type { ExtendedChannelKey } from "@/lib/campaign/channels";

/** Version interne des schémas de contenu (migrations futures). */
export const CONTENT_ASSET_SCHEMA_VERSION = 1;

/** Canaux supportés en V1 pour l'atelier contenu. */
export const CONTENT_STUDIO_V1_CHANNELS = [
  "landing",
  "seo",
  "referral",
  "google",
  "meta",
  "tiktok",
  "linkedin",
  "cold_email",
] as const;

export type ContentStudioChannelId = (typeof CONTENT_STUDIO_V1_CHANNELS)[number];

export const CONTENT_STUDIO_PHASE_SUBTITLE = "On fabrique vos contenus";

/** Hors périmètre V1 — documenté pour extension. */
export const CONTENT_STUDIO_V1_EXCLUDED = [
  "visual_generation",
  "media_upload",
  "landing_wysiwyg",
  "ab_variants",
  "locale_en",
  "direct_publish_ads_api",
] as const;

export function isContentStudioChannel(id: string): id is ContentStudioChannelId | ExtendedChannelKey {
  return id === "landing" || CONTENT_STUDIO_V1_CHANNELS.includes(id as ContentStudioChannelId);
}

export function contentAssetAnchorId(assetId: string): string {
  return `creation-asset-${assetId}`;
}
