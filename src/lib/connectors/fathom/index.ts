export {
  FathomConnectorError,
  fetchAccount,
  fetchSite,
  fetchSiteEvents,
  fetchSites,
  parseFathomCredential,
  runAggregation,
  validateCredential,
} from "@/lib/connectors/fathom/client";
export { fetchFathomConnectorSync } from "@/lib/connectors/fathom/metrics";
export {
  aggregateDailyVisitsToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromAggregationResults,
  getMonthKeys,
  parseMonthlySignups,
  parseMonthlyVisits,
  splitDateRangeForDailyQueries,
} from "@/lib/connectors/fathom/snapshots";
export {
  deleteFathomCredential,
  loadFathomCredential,
  runFathomSync,
  saveFathomCredential,
} from "@/lib/connectors/fathom/sync-service";
export type {
  FathomAccountMeta,
  FathomCredential,
  FathomEvent,
  FathomSite,
} from "@/lib/connectors/fathom/types";
