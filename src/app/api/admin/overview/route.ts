import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { getAdminOverviewMetrics } from "@/lib/admin/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  try {
    const metrics = await getAdminOverviewMetrics();
    return NextResponse.json({ ok: true, ...metrics });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
