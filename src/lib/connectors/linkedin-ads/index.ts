export { LinkedInAdsConnectorError } from "@/lib/connectors/linkedin-ads/client";
export {
  buildAnalyticsDateRange,
  buildSnapshotsFromAnalyticsRows,
  computeConversions,
  extractAnalyticsMonth,
  formatRestLiDateRange,
  getMonthKeys,
  normalizeAdAccountId,
  normalizeAnalyticsMonth,
  parseMetricInt,
  parseMetricNumber,
  parseSpend,
  toAdAccountUrn,
} from "@/lib/connectors/linkedin-ads/snapshots";
export {
  getLinkedInAdsApiVersion,
  isLinkedInAdsConfigured,
  LINKEDIN_ADS_DEFAULT_API_VERSION,
} from "@/lib/connectors/linkedin-ads/oauth";
export type { LinkedInAdsCredential } from "@/lib/connectors/linkedin-ads/types";
