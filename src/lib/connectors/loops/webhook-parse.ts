import type { LoopsWebhookPayload, ParsedLoopsWebhookEvent } from "@/lib/connectors/loops/types";

function eventTimeFromUnixSeconds(value: number | undefined): string {
  if (!value || !Number.isFinite(value)) {
    return new Date().toISOString();
  }
  return new Date(value * 1000).toISOString();
}

export function parseLoopsWebhookPayload(
  eventId: string,
  payload: LoopsWebhookPayload,
): ParsedLoopsWebhookEvent | null {
  const eventName = payload.eventName?.trim();
  if (!eventName) return null;

  return {
    eventId,
    eventName,
    eventTime: eventTimeFromUnixSeconds(payload.eventTime),
    contactId: payload.contactIdentity?.id?.trim() || null,
    mailingListId: payload.mailingList?.id?.trim() || null,
    payload,
  };
}
