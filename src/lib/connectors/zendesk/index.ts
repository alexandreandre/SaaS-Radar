export {
  ZendeskConnectorError,
  countActiveEndUsersInMonth,
  countOpenTickets,
  countSearchResults,
  ensureFreshAccessToken,
  fetchCsatMetrics,
  fetchRecentTicketMetrics,
  getAccountSettings,
  validateZendeskCredential,
  zendeskRequest,
} from "@/lib/connectors/zendesk/client";
export { fetchZendeskConnectorSync } from "@/lib/connectors/zendesk/metrics";
export {
  buildCredentialFromTokens,
  exchangeZendeskCode,
  getZendeskAuthorizeUrl,
  isZendeskConfigured,
  refreshZendeskToken,
} from "@/lib/connectors/zendesk/oauth";
export {
  buildEndUserSearchQuery,
  buildTokenExpiry,
  buildZendeskSupportStream,
  computeCsatPercent,
  extractReplyMinutes,
  getMonthKeys,
  mapEndUserCountsToSnapshots,
  medianReplyHours,
  monthDateRange,
  normalizeSubdomain,
  resolveZendeskApiBase,
} from "@/lib/connectors/zendesk/snapshots";
export {
  disconnectZendesk,
  exchangeAndStoreZendeskOAuth,
  loadZendeskCredential,
  runZendeskSync,
  saveZendeskCredential,
} from "@/lib/connectors/zendesk/sync-service";
export type {
  ZendeskAccountSettingsResponse,
  ZendeskCredential,
  ZendeskTicketMetric,
} from "@/lib/connectors/zendesk/types";
