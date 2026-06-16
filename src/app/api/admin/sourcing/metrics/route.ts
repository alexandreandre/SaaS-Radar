import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { getMetricsLast30Days } from "@/lib/sourcing/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  try {
    const metrics = await getMetricsLast30Days();
    return NextResponse.json({ metrics });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
