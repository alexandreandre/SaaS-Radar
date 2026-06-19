import type { BrevoWebhookPayload, ParsedBrevoWebhookEvent } from "@/lib/connectors/brevo/types";

function eventTimeFromPayload(payload: BrevoWebhookPayload): string {
  if (payload.ts && Number.isFinite(payload.ts)) {
    return new Date(payload.ts * 1000).toISOString();
  }
  if (payload.date?.trim()) {
    const parsed = new Date(payload.date.replace(" ", "T") + "Z");
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
}

function eventIdFromPayload(payload: BrevoWebhookPayload): string {
  if (payload.id !== undefined && payload.id !== null) {
    return String(payload.id);
  }
  const email = payload.email?.trim() ?? "unknown";
  const ts = payload.ts ?? Date.now();
  return `${email}-${ts}`;
}

export function parseBrevoWebhookPayload(payload: BrevoWebhookPayload): ParsedBrevoWebhookEvent | null {
  const eventName = payload.event?.trim();
  if (!eventName) return null;

  const supported = eventName === "list_addition" || eventName === "click";
  if (!supported) return null;

  const contactId = payload.email?.trim() || (payload.id !== undefined ? String(payload.id) : null);
  const listIds = Array.isArray(payload.list_id)
    ? payload.list_id.filter((id) => Number.isFinite(id))
    : [];

  return {
    eventId: eventIdFromPayload(payload),
    eventName,
    eventTime: eventTimeFromPayload(payload),
    contactId,
    listIds,
    payload,
  };
}
