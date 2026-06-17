import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserProject } from "@/lib/portfolio";
import { migrateProject } from "@/lib/portfolio";

type UserProjectRow = {
  id: string;
  opportunity_slug: string | null;
  name: string;
  phase: string;
  mrr_cents: number;
  payload: unknown;
  created_at: string;
};

function readPayloadRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function rowToUserProject(row: UserProjectRow): UserProject {
  const payload = readPayloadRecord(row.payload);

  if (readString(payload.id) === row.id && readString(payload.opportunitySlug)) {
    return migrateProject(payload as UserProject);
  }

  return migrateProject({
    ...(payload as UserProject),
    id: row.id,
    opportunitySlug: row.opportunity_slug ?? readString(payload.opportunitySlug) ?? "",
    productName: readString(payload.productName) ?? row.name,
    phase: (row.phase as UserProject["phase"]) ?? "build",
    currentMrr: row.mrr_cents / 100,
    createdAt: readString(payload.createdAt) ?? row.created_at,
    startedAt: readString(payload.startedAt) ?? row.created_at,
  });
}

export async function loadUserProjects(userId: string): Promise<UserProject[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_projects")
    .select("id, opportunity_slug, name, phase, mrr_cents, payload, created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToUserProject(row as UserProjectRow));
}

export async function syncUserProject(userId: string, project: UserProject) {
  const supabase = await createServerSupabaseClient();
  const migrated = migrateProject(project);

  const { error } = await supabase.from("user_projects").upsert(
    {
      id: migrated.id,
      user_id: userId,
      opportunity_slug: migrated.opportunitySlug,
      name: migrated.productName?.trim() || migrated.opportunitySlug,
      phase: migrated.phase,
      mrr_cents: Math.round(migrated.currentMrr * 100),
      payload: migrated,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

export async function deleteUserProject(userId: string, projectId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("user_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw error;
}

/** @deprecated Utiliser syncUserProject — conservé pour compatibilité interne. */
export type SyncProjectMetricsInput = UserProject;

/** @deprecated Utiliser syncUserProject */
export async function syncProjectMetrics(userId: string, project: UserProject) {
  return syncUserProject(userId, project);
}
