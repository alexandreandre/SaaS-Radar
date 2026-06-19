import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ParsedResendWebhookEvent,
  ResendStoredEvent,
} from "@/lib/connectors/resend/types";

export { parseResendWebhookPayload } from "@/lib/connectors/resend/webhook-parse";

export async function insertResendWebhookEvent(
  projectId: string,
  event: ParsedResendWebhookEvent,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("connector_webhook_events").insert({
    project_id: projectId,
    provider: "resend",
    event_id: event.eventId,
    event_name: event.eventName,
    event_time: event.eventTime,
    contact_id: event.contactId ?? event.recipientEmail,
    mailing_list_id: event.segmentId,
    payload: event.payload,
  });

  if (!error) return true;

  if (error.code === "23505") {
    return false;
  }

  throw error;
}

export async function fetchResendWebhookEvents(
  projectId: string,
  sinceIso: string,
): Promise<ResendStoredEvent[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("connector_webhook_events")
    .select("event_name, event_time, contact_id, mailing_list_id")
    .eq("project_id", projectId)
    .eq("provider", "resend")
    .gte("event_time", sinceIso)
    .order("event_time", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    eventName: row.event_name as string,
    eventTime: row.event_time as string,
    contactId: (row.contact_id as string | null) ?? null,
    segmentId: (row.mailing_list_id as string | null) ?? null,
    recipientEmail:
      row.event_name === "email.clicked" ? ((row.contact_id as string | null) ?? null) : null,
  }));
}

export async function deleteResendWebhookEvents(projectId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("connector_webhook_events")
    .delete()
    .eq("project_id", projectId)
    .eq("provider", "resend");

  if (error) throw error;
}

export function sinceIsoForMonths(months: number): string {
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return since.toISOString();
}
