import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildAuthCallbackUrl,
  sanitizeAdminNext,
  sanitizeAuthNext,
} from "@/lib/auth/callback-url";
import { getRequestOrigin } from "@/lib/site-url";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string; next?: string; scope?: "admin" | "app" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    return NextResponse.json({ error: "Auth non configurée" }, { status: 503 });
  }

  const next =
    body.scope === "admin"
      ? sanitizeAdminNext(body.next ?? null)
      : sanitizeAuthNext(body.next ?? null);

  const emailRedirectTo = buildAuthCallbackUrl(getRequestOrigin(request), next);

  const supabase = createClient(url, key);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
