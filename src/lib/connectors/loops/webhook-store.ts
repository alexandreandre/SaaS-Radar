import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  LoopsStoredEvent,
  ParsedLoopsWebhookEvent,
} from "@/lib/connectors/loops/types";

export { parseLoopsWebhookPayload } from "@/lib/connectors/loops/webhook-parse";

export async function insertLoopsWebhookEvent(
  projectId: string,
  event: ParsedLoopsWebhookEvent,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("connector_webhook_events").insert({
    project_id: projectId,
    provider: "loops",
    event_id: event.eventId,
    event_name: event.eventName,
    event_time: event.eventTime,
    contact_id: event.contactId,
    mailing_list_id: event.mailingListId,
    payload: event.payload,
  });

  if (!error) return true;

  if (error.code === "23505") {
    return false;
  }

  throw error;
}

export async function fetchLoopsWebhookEvents(
  projectId: string,
  sinceIso: string,
): Promise<LoopsStoredEvent[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("connector_webhook_events")
    .select("event_name, event_time, contact_id, mailing_list_id")
    .eq("project_id", projectId)
    .eq("provider", "loops")
    .gte("event_time", sinceIso)
    .order("event_time", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    eventName: row.event_name as string,
    eventTime: row.event_time as string,
    contactId: (row.contact_id as string | null) ?? null,
    mailingListId: (row.mailing_list_id as string | null) ?? null,
  }));
}

export async function deleteLoopsWebhookEvents(projectId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("connector_webhook_events")
    .delete()
    .eq("project_id", projectId)
    .eq("provider", "loops");

  if (error) throw error;
}

export function sinceIsoForMonths(months: number): string {
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return since.toISOString();
}
