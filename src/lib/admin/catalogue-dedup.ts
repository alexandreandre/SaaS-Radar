import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateOpportunitiesCache } from "@/lib/admin/weekly-pick";
import { normalizeUrlKey, rootDomainFromUrl } from "@/lib/admin/sourcing-dedup.shared";

type CatalogueRow = {
  slug: string;
  name: string;
  url: string | null;
  origin_country_code: string;
};

function brandKey(name: string): string | null {
  const token = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)[0];
  return token && token.length >= 5 ? token : null;
}

/** Archive les fiches publiées qui doublonnent une fiche archivée (URL, domaine ou marque+pays). */
export async function resolvePublishedArchivedDuplicates(): Promise<number> {
  const admin = createAdminClient();

  const [{ data: archived, error: archErr }, { data: published, error: pubErr }] =
    await Promise.all([
      admin
        .from("opportunities")
        .select("slug, name, url, origin_country_code")
        .eq("status", "archived"),
      admin
        .from("opportunities")
        .select("slug, name, url, origin_country_code")
        .eq("status", "published"),
    ]);

  if (archErr) throw new Error(archErr.message);
  if (pubErr) throw new Error(pubErr.message);

  const archivedSlugs = new Set<string>();
  const archivedUrls = new Set<string>();
  const archivedDomains = new Set<string>();
  const archivedBrands = new Map<string, Set<string>>();

  for (const row of (archived ?? []) as CatalogueRow[]) {
    archivedSlugs.add(row.slug);
    if (row.url) {
      archivedUrls.add(normalizeUrlKey(row.url));
      const domain = rootDomainFromUrl(row.url);
      if (domain) archivedDomains.add(domain);
    }
    const brand = brandKey(row.name);
    if (brand) {
      const countries = archivedBrands.get(brand) ?? new Set<string>();
      countries.add(row.origin_country_code);
      archivedBrands.set(brand, countries);
    }
  }

  const toArchive = new Set<string>();
  for (const row of (published ?? []) as CatalogueRow[]) {
    if (archivedSlugs.has(row.slug)) {
      toArchive.add(row.slug);
      continue;
    }
    const brand = brandKey(row.name);
    if (brand && archivedBrands.get(brand)?.has(row.origin_country_code)) {
      toArchive.add(row.slug);
      continue;
    }
    if (!row.url) continue;
    const urlKey = normalizeUrlKey(row.url);
    const domain = rootDomainFromUrl(row.url);
    if (archivedUrls.has(urlKey) || (domain && archivedDomains.has(domain))) {
      toArchive.add(row.slug);
    }
  }

  if (toArchive.size === 0) return 0;

  const { error } = await admin
    .from("opportunities")
    .update({ status: "archived" })
    .in("slug", Array.from(toArchive));
  if (error) throw new Error(error.message);

  revalidateOpportunitiesCache();
  return toArchive.size;
}
