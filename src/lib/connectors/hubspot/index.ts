export {
  HubSpotConnectorError,
  buildHubSpotAccountLabel,
  ensureFreshAccessToken,
  fetchDealPipelines,
  getAccessTokenInfo,
  searchAllDeals,
  searchDeals,
  searchDealsInStages,
  validateHubSpotCredential,
} from "@/lib/connectors/hubspot/client";
export {
  buildHubSpotCrmStream,
  classifyPipelineStages,
  computeAvgCycleDays,
  parseDealAmount,
  parseHubSpotDate,
  sumPipelineValue,
  CYCLE_WINDOW_DAYS,
  WON_LOST_WINDOW_DAYS,
} from "@/lib/connectors/hubspot/crm-stream";
export { fetchHubSpotConnectorSync } from "@/lib/connectors/hubspot/metrics";
export {
  getHubSpotAuthorizeUrl,
  getHubSpotRedirectUri,
  isHubSpotConfigured,
  exchangeHubSpotCode,
  refreshHubSpotAccessToken,
} from "@/lib/connectors/hubspot/oauth";
export {
  disconnectHubSpot,
  exchangeAndStoreHubSpotOAuth,
  loadHubSpotCredential,
  runHubSpotSync,
  saveHubSpotCredential,
} from "@/lib/connectors/hubspot/sync-service";
export type {
  HubSpotCredential,
  HubSpotDeal,
  HubSpotPipeline,
  HubSpotPipelineStage,
} from "@/lib/connectors/hubspot/types";
