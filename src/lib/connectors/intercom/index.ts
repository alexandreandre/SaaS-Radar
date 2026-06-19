export {
  IntercomConnectorError,
  buildCredentialFromMe,
  countActiveContactsInRange,
  countOpenConversations,
  countSearchResults,
  fetchConversationsForMedianResponse,
  fetchCsatMetrics,
  getMe,
  intercomRequest,
  validateIntercomCredential,
} from "@/lib/connectors/intercom/client";
export { fetchIntercomConnectorSync } from "@/lib/connectors/intercom/metrics";
export {
  exchangeIntercomCode,
  getIntercomAuthorizeUrl,
  isIntercomConfigured,
} from "@/lib/connectors/intercom/oauth";
export {
  INTERCOM_API_VERSION,
  buildIntercomSupportStream,
  computeCsatPercent,
  getMonthKeys,
  mapContactsCountsToSnapshots,
  medianResponseHours,
  monthUnixRange,
  resolveIntercomApiBase,
} from "@/lib/connectors/intercom/snapshots";
export {
  disconnectIntercom,
  exchangeAndStoreIntercomOAuth,
  loadIntercomCredential,
  runIntercomSync,
  saveIntercomCredential,
} from "@/lib/connectors/intercom/sync-service";
export type {
  IntercomConversation,
  IntercomCredential,
  IntercomMeResponse,
  IntercomRegion,
} from "@/lib/connectors/intercom/types";
