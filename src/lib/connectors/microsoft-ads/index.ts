export { MicrosoftAdsConnectorError } from "@/lib/connectors/microsoft-ads/client";
export {
  buildAccessTokenExpiry,
  getMicrosoftAdsAuthorizeUrl,
  isMicrosoftAdsGoogleOAuthConfigured,
  isMicrosoftAdsMicrosoftOAuthConfigured,
  isMicrosoftAdsOAuthConfigured,
  oauthProviderToIdentity,
  type MicrosoftAdsOAuthProvider,
} from "@/lib/connectors/microsoft-ads/oauth";
export {
  buildReportDateRange,
  buildSnapshotsFromReportRows,
  extractConversions,
  getMonthKeys,
  normalizeAccountId,
  normalizeCustomerId,
  normalizeMonthSegment,
  parseReportCsv,
  parseSpend,
} from "@/lib/connectors/microsoft-ads/snapshots";
export type {
  MicrosoftAdsAccountSummary,
  MicrosoftAdsCredential,
  MicrosoftAdsIdentityProvider,
  MicrosoftAdsReportRow,
} from "@/lib/connectors/microsoft-ads/types";
