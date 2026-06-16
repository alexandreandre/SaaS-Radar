import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { executePendingJobs } from "@/lib/admin/process-sourcing-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, {
    minimumRole: "editor",
    requireEdit: true,
    rateLimitKey: "admin:sourcing:process-queue",
    rateLimitMax: 30,
  });
  if (auth instanceof NextResponse) return auth;

  let body: { maxJobs?: unknown; runIds?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // defaults
  }

  const maxJobs =
    body.maxJobs != null ? Number.parseInt(String(body.maxJobs), 10) : 10;
  const runIds = Array.isArray(body.runIds)
    ? body.runIds.map(String).filter(Boolean)
    : undefined;

  try {
    const { processed, failed } = await executePendingJobs({
      maxJobs: Number.isFinite(maxJobs) && maxJobs > 0 ? maxJobs : 10,
      runIds,
    });

    await withAdminAudit(auth.ctx, {
      action: "sourcing.process_queue",
      targetType: "sourcing_run",
      metadata: { processed, failed },
    });

    return NextResponse.json({ processed, failed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
