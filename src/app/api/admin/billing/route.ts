import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import {
  computeBillingMetrics,
  createBillingSnapshot,
} from "@/lib/admin/metrics";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  try {
    const metrics = await computeBillingMetrics();
    const admin = createAdminClient();
    const { data: snapshots } = await admin
      .from("billing_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .limit(30);

    const { data: subscribers } = await admin
      .from("profiles")
      .select("id, email, plan, subscription_status, billing_interval, current_period_end, stripe_customer_id, created_at")
      .neq("plan", "free")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ metrics, snapshots: snapshots ?? [], subscribers: subscribers ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "editor", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  try {
    await createBillingSnapshot();
    await withAdminAudit(auth.ctx, { action: "billing.snapshot", targetType: "billing" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
