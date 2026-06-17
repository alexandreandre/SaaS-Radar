import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { loadPublishSettings } from "@/lib/admin/publish-policy";

function createAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Notifie via webhook si notify_on_pending et brouillons restants. */
export async function notifyPendingDraftsIfEnabled(runId: string | null): Promise<void> {
  const settings = await loadPublishSettings();
  if (!settings.notify_on_pending) return;

  const webhook = process.env.SOURCING_NOTIFY_WEBHOOK_URL;
  if (!webhook) {
    console.warn("[sourcing] notify_on_pending actif mais SOURCING_NOTIFY_WEBHOOK_URL absent");
    return;
  }

  const admin = createAdminClient();
  if (!admin) return;

  const { count } = await admin
    .from("opportunity_drafts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (!count || count === 0) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "sourcing.pending_drafts",
        pendingCount: count,
        runId,
        at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn(
      "[sourcing] notification webhook échouée :",
      err instanceof Error ? err.message : err
    );
  }
}
