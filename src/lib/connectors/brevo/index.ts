export {
  BrevoConnectorError,
  buildAccountMeta,
  fetchAccount,
  getBrevoWebhookUrl,
  listContactLists,
  parseBrevoCredential,
  validateApiKey,
  validateCredential,
  generateWebhookToken,
} from "@/lib/connectors/brevo/client";
export { fetchBrevoConnectorSync } from "@/lib/connectors/brevo/metrics";
export {
  aggregateCampaignClicksToConversions,
  aggregateContactsToSignups,
  aggregateWebhookListAdditions,
  buildBrevoSnapshots,
  getMonthKeys,
} from "@/lib/connectors/brevo/snapshots";
export {
  deleteBrevoCredential,
  loadBrevoCredential,
  runBrevoSync,
  saveBrevoCredential,
} from "@/lib/connectors/brevo/sync-service";
export type {
  BrevoAccountMeta,
  BrevoContact,
  BrevoContactList,
  BrevoConversionMode,
  BrevoCredential,
  BrevoEmailCampaign,
  BrevoStoredEvent,
  BrevoWebhookPayload,
} from "@/lib/connectors/brevo/types";
export { parseBrevoWebhookPayload } from "@/lib/connectors/brevo/webhook-parse";
export { verifyBrevoWebhookToken } from "@/lib/connectors/brevo/webhook-verify";
export {
  deleteBrevoWebhookEvents,
  fetchBrevoWebhookEvents,
  insertBrevoWebhookEvent,
} from "@/lib/connectors/brevo/webhook-store";
