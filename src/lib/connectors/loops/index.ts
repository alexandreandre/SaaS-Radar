export {
  LoopsConnectorError,
  buildAccountMeta,
  getLoopsWebhookUrl,
  listMailingLists,
  parseLoopsCredential,
  validateApiKey,
  validateCredential,
} from "@/lib/connectors/loops/client";
export { fetchLoopsConnectorSync } from "@/lib/connectors/loops/metrics";
export {
  aggregateLoopsEventsToSnapshots,
  buildEmptySnapshots,
  getMonthKeys,
} from "@/lib/connectors/loops/snapshots";
export {
  deleteLoopsCredential,
  loadLoopsCredential,
  runLoopsSync,
  saveLoopsCredential,
} from "@/lib/connectors/loops/sync-service";
export type {
  LoopsAccountMeta,
  LoopsConversionMode,
  LoopsCredential,
  LoopsMailingList,
  LoopsStoredEvent,
  LoopsWebhookPayload,
} from "@/lib/connectors/loops/types";
export {
  extractLoopsWebhookHeaders,
  verifyLoopsWebhookSignature,
} from "@/lib/connectors/loops/webhook-verify";
export {
  deleteLoopsWebhookEvents,
  fetchLoopsWebhookEvents,
  insertLoopsWebhookEvent,
} from "@/lib/connectors/loops/webhook-store";
export { parseLoopsWebhookPayload } from "@/lib/connectors/loops/webhook-parse";
