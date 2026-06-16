import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { listAuditLogs } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
  const targetId = url.searchParams.get("target_id");

  try {
    const result = await listAuditLogs({ limit, offset, targetId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "owner", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  await withAdminAudit(auth.ctx, {
    action: "audit.export",
    targetType: "audit_log",
  });

  return NextResponse.json({ ok: true });
}
