/**
 * Déclenche la revalidation ISR après un upsert de sourcing.
 * En contexte Next.js (API admin / process-queue), invalide le cache in-process.
 * Hors Next.js (CLI), tente POST /api/revalidate si REVALIDATE_SECRET est défini.
 */
export async function triggerRevalidation(): Promise<void> {
  try {
    const { revalidateOpportunitiesCache } = await import("@/lib/admin/weekly-pick");
    revalidateOpportunitiesCache();
    console.log("🔁 Revalidation catalogue (in-process)");
    return;
  } catch {
    // Script CLI ou worker hors runtime Next — fallback HTTP ci-dessous.
  }

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.log("🔁 Revalidation ignorée (REVALIDATE_SECRET non défini)");
    return;
  }

  // Prod : URL explicite. Local : fallback localhost si le serveur Next tourne (npm run dev).
  const base =
    process.env.SOURCING_REVALIDATE_URL ??
    (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined);

  if (!base) {
    console.log(
      "🔁 Revalidation ignorée (SOURCING_REVALIDATE_URL non défini en production)"
    );
    return;
  }

  const endpoint = new URL("/api/revalidate", base).toString();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`⚠️  Revalidation HTTP ${res.status}: ${text.slice(0, 200)}`);
      return;
    }
    console.log("🔁 Revalidation prod déclenchée (/, /opportunities, fiches)");
  } catch (err) {
    console.warn(
      `⚠️  Revalidation échouée: ${err instanceof Error ? err.message : err}`
    );
  }
}
