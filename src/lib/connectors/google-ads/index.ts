export { GoogleAdsConnectorError } from "@/lib/connectors/google-ads/client";
export {
  buildMonthlyMetricsQuery,
  buildSnapshotsFromGaqlRows,
  getMonthKeys,
  GOOGLE_ADS_API_VERSION,
  microsToCurrency,
  normalizeCustomerId,
  normalizeMonthSegment,
} from "@/lib/connectors/google-ads/snapshots";
export { isGoogleAdsConfigured } from "@/lib/connectors/google-ads/oauth";
export type { GoogleAdsCredential } from "@/lib/connectors/google-ads/types";
