import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminNewsletterData = {
  stats: {
    total: number;
    active: number;
    pending: number;
  };
  subscribers: Record<string, unknown>[];
  campaigns: Record<string, unknown>[];
};

export async function getAdminNewsletterData(): Promise<AdminNewsletterData> {
  const admin = createAdminClient();
  const [subs, campaigns] = await Promise.all([
    admin.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("newsletter_campaigns").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  if (subs.error) throw new Error(subs.error.message);
  if (campaigns.error) throw new Error(campaigns.error.message);

  const subscribers = (subs.data ?? []) as Record<string, unknown>[];
  const active = subscribers.filter((s) => s.status === "active").length;
  const pending = subscribers.filter((s) => s.status === "pending").length;

  return {
    stats: { total: subscribers.length, active, pending },
    subscribers,
    campaigns: (campaigns.data ?? []) as Record<string, unknown>[],
  };
}
