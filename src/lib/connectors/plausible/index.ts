export {
  PlausibleConnectorError,
  fetchSiteGoals,
  getPlausibleApiBase,
  parsePlausibleCredential,
  runStatsQuery,
  validateCredential,
} from "@/lib/connectors/plausible/client";
export { fetchPlausibleConnectorSync } from "@/lib/connectors/plausible/metrics";
export {
  aggregateDailyVisitorsToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromQueryResults,
  getMonthKeys,
  parseMonthlySignups,
  parseMonthlyVisitors,
} from "@/lib/connectors/plausible/snapshots";
export {
  deletePlausibleCredential,
  loadPlausibleCredential,
  runPlausibleSync,
  savePlausibleCredential,
} from "@/lib/connectors/plausible/sync-service";
export type {
  PlausibleAccountMeta,
  PlausibleCredential,
  PlausibleGoal,
  PlausibleQueryResponse,
} from "@/lib/connectors/plausible/types";
