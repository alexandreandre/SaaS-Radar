import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { getAdminSourcingSummary } from "@/lib/admin/sourcing-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  try {
    const summary = await getAdminSourcingSummary();
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
