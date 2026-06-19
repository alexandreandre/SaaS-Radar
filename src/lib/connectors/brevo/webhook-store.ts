import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { BrevoStoredEvent, ParsedBrevoWebhookEvent } from "@/lib/connectors/brevo/types";

export { parseBrevoWebhookPayload } from "@/lib/connectors/brevo/webhook-parse";

export async function insertBrevoWebhookEvent(
  projectId: string,
  event: ParsedBrevoWebhookEvent,
): Promise<boolean> {
  const supabase = createAdminClient();
  const listId =
    event.listIds.length > 0 ? String(event.listIds[0]) : null;

  const { error } = await supabase.from("connector_webhook_events").insert({
    project_id: projectId,
    provider: "brevo",
    event_id: event.eventId,
    event_name: event.eventName,
    event_time: event.eventTime,
    contact_id: event.contactId,
    mailing_list_id: listId,
    payload: event.payload,
  });

  if (!error) return true;

  if (error.code === "23505") {
    return false;
  }

  throw error;
}

export async function fetchBrevoWebhookEvents(
  projectId: string,
  sinceIso: string,
): Promise<BrevoStoredEvent[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("connector_webhook_events")
    .select("event_name, event_time, contact_id, mailing_list_id, payload")
    .eq("project_id", projectId)
    .eq("provider", "brevo")
    .gte("event_time", sinceIso)
    .order("event_time", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const payload = row.payload as { list_id?: number[] } | null;
    const listIdsFromPayload = Array.isArray(payload?.list_id) ? payload.list_id : [];
    const listIdFromColumn = row.mailing_list_id
      ? Number(row.mailing_list_id)
      : null;
    const listIds =
      listIdsFromPayload.length > 0
        ? listIdsFromPayload
        : listIdFromColumn !== null && !Number.isNaN(listIdFromColumn)
          ? [listIdFromColumn]
          : [];

    return {
      eventName: row.event_name as string,
      eventTime: row.event_time as string,
      contactId: (row.contact_id as string | null) ?? null,
      listIds,
    };
  });
}

export async function deleteBrevoWebhookEvents(projectId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("connector_webhook_events")
    .delete()
    .eq("project_id", projectId)
    .eq("provider", "brevo");

  if (error) throw error;
}

export function sinceIsoForMonths(months: number): string {
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return since.toISOString();
}
