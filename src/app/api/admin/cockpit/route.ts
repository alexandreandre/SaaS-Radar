import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();

  const [projects, connectors] = await Promise.all([
    admin.from("user_projects").select("*").order("updated_at", { ascending: false }).limit(50),
    admin.from("connector_snapshots").select("*").order("synced_at", { ascending: false }).limit(50),
  ]);

  const demoConnectors = (connectors.data ?? []).filter((c) => c.status === "demo").length;

  return NextResponse.json({
    note: "Portfolio utilisateur synchronisé sur user_projects (source de vérité compte). localStorage sert de cache local.",
    projects: projects.data ?? [],
    connectors: connectors.data ?? [],
    stats: {
      projectCount: projects.data?.length ?? 0,
      connectorSnapshots: connectors.data?.length ?? 0,
      demoConnectors,
    },
  });
}
