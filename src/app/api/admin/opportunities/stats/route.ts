import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { getCatalogueStats } from "@/lib/admin/catalogue-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await getCatalogueStats();
    return NextResponse.json({ stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur stats catalogue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
