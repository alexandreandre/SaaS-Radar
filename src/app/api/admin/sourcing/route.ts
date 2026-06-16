import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { runSourcing } from "@/lib/sourcing/run";
import { SECTORS } from "@/lib/sourcing/constants";
import { OPPORTUNITIES_CACHE_TAG } from "@/lib/opportunities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Le sourcing enchaîne plusieurs appels IA : on autorise une exécution longue.
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SOURCING_SECRET;
  if (!secret) return false;
  return request.headers.get("x-admin-secret") === secret;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** GET : derniers runs de sourcing (observabilité super-admin). */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("sourcing_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ runs: data ?? [] });
}

/** POST : déclenche un run de sourcing (protégé). Body : { count, sector?, premium? }. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { count?: unknown; sector?: unknown; premium?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // body vide accepté → valeurs par défaut
  }

  const count = Number.parseInt(String(body.count ?? 3), 10);
  if (!Number.isFinite(count) || count < 1 || count > 10) {
    return NextResponse.json(
      { error: "count doit être un entier entre 1 et 10" },
      { status: 400 }
    );
  }

  let sector: string | undefined;
  if (body.sector != null && body.sector !== "") {
    sector = String(body.sector);
    if (!(SECTORS as readonly string[]).includes(sector)) {
      return NextResponse.json(
        { error: `sector invalide. Valeurs : ${SECTORS.join(", ")}` },
        { status: 400 }
      );
    }
  }

  const premium = body.premium === true;

  try {
    // revalidate:false → on déclenche la revalidation localement après coup (pas de self-HTTP).
    const report = await runSourcing({ count, sector, premium, revalidate: false });

    if (report.written > 0) {
      revalidatePath("/");
      revalidateTag(OPPORTUNITIES_CACHE_TAG);
      revalidatePath("/opportunities", "page");
      revalidatePath("/opportunities/[slug]", "page");
    }

    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
