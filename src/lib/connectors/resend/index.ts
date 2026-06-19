export type {
  ResendAccountMeta,
  ResendContact,
  ResendConversionMode,
  ResendCredential,
  ResendDomain,
  ResendSegment,
  ResendStoredEvent,
  ParsedResendWebhookEvent,
} from "@/lib/connectors/resend/types";

export {
  parseResendCredential,
  parseResendApiKey,
  isValidWebhookSigningSecret,
} from "@/lib/connectors/resend/keys";

export {
  aggregateContactsToSignups,
  aggregateEmailClicksToConversions,
  buildResendSnapshots,
  getMonthKeys,
  contactCreatedAtToMonthKey,
  eventTimeToMonthKey,
} from "@/lib/connectors/resend/snapshots";

export { parseResendWebhookPayload } from "@/lib/connectors/resend/webhook-parse";

export {
  extractResendWebhookHeaders,
  verifyResendWebhookSignature,
} from "@/lib/connectors/resend/webhook-verify";

export {
  runResendSync,
  saveResendCredential,
  deleteResendCredential,
  loadResendCredential,
} from "@/lib/connectors/resend/sync-service";

export {
  getResendWebhookUrl,
  resolveAccountLabel,
} from "@/lib/connectors/resend/client";
