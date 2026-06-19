import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCockpitData = {
  note: string;
  projects: Record<string, unknown>[];
  connectors: Record<string, unknown>[];
  stats: {
    projectCount: number;
    connectorSnapshots: number;
    demoConnectors: number;
  };
};

export async function getAdminCockpitData(): Promise<AdminCockpitData> {
  const admin = createAdminClient();
  const [projects, connectors] = await Promise.all([
    admin.from("user_projects").select("*").order("updated_at", { ascending: false }).limit(50),
    admin.from("connector_snapshots").select("*").order("synced_at", { ascending: false }).limit(50),
  ]);

  if (projects.error) throw new Error(projects.error.message);
  if (connectors.error) throw new Error(connectors.error.message);

  const connectorRows = (connectors.data ?? []) as Record<string, unknown>[];
  const demoConnectors = connectorRows.filter((c) => c.status === "demo").length;

  return {
    note: "Portfolio utilisateur synchronisé sur user_projects (source de vérité compte). localStorage sert de cache local.",
    projects: (projects.data ?? []) as Record<string, unknown>[],
    connectors: connectorRows,
    stats: {
      projectCount: projects.data?.length ?? 0,
      connectorSnapshots: connectorRows.length,
      demoConnectors,
    },
  };
}
