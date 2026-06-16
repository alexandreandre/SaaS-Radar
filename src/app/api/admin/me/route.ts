import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    role: auth.ctx.role,
    email: auth.ctx.email,
    userId: auth.ctx.userId,
  });
}
