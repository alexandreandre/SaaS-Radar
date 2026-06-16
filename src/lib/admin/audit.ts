import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type AuditEntry = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  beforeState?: Json | null;
  afterState?: Json | null;
  metadata?: Json;
};

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const h = await headers();
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      actor_id: entry.actorId ?? null,
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
      user_agent: h.get("user-agent"),
      before_state: entry.beforeState ?? null,
      after_state: entry.afterState ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.warn("[audit] write failed:", err instanceof Error ? err.message : err);
  }
}

export async function listAuditLogs(opts: {
  limit?: number;
  offset?: number;
  targetId?: string | null;
} = {}): Promise<{ logs: Record<string, unknown>[]; total: number }> {
  const admin = createAdminClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let query = admin
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (opts.targetId) {
    query = query.eq("target_id", opts.targetId);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { logs: data ?? [], total: count ?? 0 };
}
