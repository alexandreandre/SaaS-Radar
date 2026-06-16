import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/admin/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Inscription publique newsletter (remplace le mock client-side). */
export async function POST(request: Request) {
  const limited = await checkRateLimit(
    `newsletter:${request.headers.get("x-forwarded-for") ?? "unknown"}`,
    5,
    3600
  );
  if (!limited.allowed) {
    return NextResponse.json({ error: "Trop de tentatives" }, { status: 429 });
  }

  let body: { email?: string; source?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("newsletter_subscribers").upsert(
    {
      email,
      source: body.source ?? "website",
      status: "active",
      confirmed_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
