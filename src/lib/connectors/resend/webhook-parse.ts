import type { ParsedResendWebhookEvent, ResendWebhookPayload } from "@/lib/connectors/resend/types";

const TRACKED_EVENTS = new Set(["email.clicked", "contact.created"]);

function eventTimeFromPayload(payload: ResendWebhookPayload): string {
  const clickTime = payload.data?.click?.timestamp;
  if (clickTime) return clickTime;

  const createdAt = payload.data?.created_at ?? payload.created_at;
  if (createdAt) {
    const normalized = createdAt.includes("T") ? createdAt : createdAt.replace(" ", "T");
    if (normalized.endsWith("+00") && !normalized.includes("+00:")) {
      return normalized.replace("+00", "+00:00");
    }
    return normalized;
  }

  return new Date().toISOString();
}

export function parseResendWebhookPayload(
  eventId: string,
  payload: ResendWebhookPayload,
): ParsedResendWebhookEvent | null {
  const eventName = payload.type?.trim();
  if (!eventName || !TRACKED_EVENTS.has(eventName)) return null;

  const contactId = payload.data?.id?.trim() || null;
  const segmentIds = payload.data?.segment_ids ?? [];
  const segmentId = segmentIds.length > 0 ? segmentIds[0] ?? null : null;
  const recipientEmail = payload.data?.to?.[0]?.trim().toLowerCase() ?? null;

  return {
    eventId,
    eventName,
    eventTime: eventTimeFromPayload(payload),
    contactId,
    segmentId,
    recipientEmail,
    payload,
  };
}
