import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function assertProjectOwnedByUser(
  userId: string,
  projectId: string,
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Projet introuvable ou accès refusé");
  }
}
