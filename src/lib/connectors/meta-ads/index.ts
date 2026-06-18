export { MetaAdsConnectorError } from "@/lib/connectors/meta-ads/client";
export {
  buildInsightsTimeRange,
  buildSnapshotsFromInsightRows,
  getMonthKeys,
  isConversionAction,
  META_ADS_API_VERSION,
  normalizeAdAccountId,
  normalizeInsightMonth,
  parseSpend,
  sumConversionActions,
} from "@/lib/connectors/meta-ads/snapshots";
export { isMetaAdsConfigured } from "@/lib/connectors/meta-ads/oauth";
export type { MetaAdsCredential } from "@/lib/connectors/meta-ads/types";
