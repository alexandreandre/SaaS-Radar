export { TikTokAdsConnectorError } from "@/lib/connectors/tiktok-ads/client";
export {
  buildReportDateRange,
  buildSnapshotsFromReportRows,
  extractReportMonth,
  getMonthKeys,
  normalizeAdvertiserId,
  normalizeReportMonth,
  parseMetricInt,
  parseMetricNumber,
  parseSpend,
} from "@/lib/connectors/tiktok-ads/snapshots";
export {
  isTikTokAdsConfigured,
  TIKTOK_ADS_API_VERSION,
} from "@/lib/connectors/tiktok-ads/oauth";
export type { TikTokAdsCredential } from "@/lib/connectors/tiktok-ads/types";
