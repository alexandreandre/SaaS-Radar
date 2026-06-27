import { NextResponse } from "next/server";
import { runWeeklySend } from "@/lib/newsletter/weekly-sender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  const xAdmin = request.headers.get("x-admin-secret") ?? "";
  if (adminToken && xAdmin === adminToken) return true;

  return false;
}

/**
 * GET /api/newsletter/send-weekly
 * Vercel Cron envoie des GET requests avec Authorization: Bearer ${CRON_SECRET}.
 * Cette route déclenche l'envoi complet de la campagne (mode prod).
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const result = await runWeeklySend();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[newsletter/send-weekly/cron]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/newsletter/send-weekly
 * Appel manuel via x-admin-secret pour tests.
 * Body optionnel : { "testEmail": "you@example.com" } → transactionnel de test
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let testEmail: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.testEmail === "string" && body.testEmail.includes("@")) {
      testEmail = body.testEmail;
    }
  } catch {
    // body optionnel
  }

  try {
    const result = await runWeeklySend({ testEmail });
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[newsletter/send-weekly]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
