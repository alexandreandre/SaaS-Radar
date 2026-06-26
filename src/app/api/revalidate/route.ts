import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { OPPORTUNITIES_CACHE_TAG } from "@/lib/opportunities-cache-tag";

export const dynamic = "force-dynamic";

/**
 * Revalidation à la demande, appelée par le pipeline de sourcing après un upsert
 * (script CLI / GitHub Actions) pour refléter les nouvelles fiches sans redéploiement.
 *
 * Auth : header `x-revalidate-secret` ou query `?secret=` comparé à REVALIDATE_SECRET.
 *
 * Pages impactées par un nouvel upsert d'opportunité :
 *  - `/`                       (home : catalogue + stats carte)
 *  - `/opportunities`          (liste, tag `opportunities`)
 *  - `/opportunities/[slug]`   (fiches SSG/ISR)
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  const provided =
    request.headers.get("x-revalidate-secret") ?? url.searchParams.get("secret");
  return provided === secret;
}

function revalidateAll(): string[] {
  const revalidated: string[] = [];

  revalidatePath("/");
  revalidated.push("/");

  revalidateTag(OPPORTUNITIES_CACHE_TAG);
  revalidated.push(`tag:${OPPORTUNITIES_CACHE_TAG}`);

  // Type 'page' explicite : invalide le HTML snapshot de la liste (pas seulement le layout).
  revalidatePath("/opportunities", "page");
  revalidated.push("/opportunities");

  revalidatePath("/opportunities/[slug]", "page");
  revalidated.push("/opportunities/[slug]");

  return revalidated;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ revalidated: false, error: "Unauthorized" }, { status: 401 });
  }
  const revalidated = revalidateAll();
  return NextResponse.json({ revalidated: true, paths: revalidated, now: Date.now() });
}
