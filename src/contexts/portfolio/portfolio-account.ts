import { migrateProject, type UserProject } from "@/lib/portfolio";
import {
  fetchAccountProjects,
  uploadAccountProject,
} from "@/lib/portfolio-sync-client";
import {
  clearGuestPortfolioStorage,
  migrateLegacyPortfolioStorage,
  persistProjects,
  portfolioStorageKey,
  PORTFOLIO_GUEST_STORAGE_KEY,
  readStoredProjects,
} from "@/lib/portfolio-storage.shared";

/** Charge les projets compte — le serveur est la source de vérité au login. */
export async function loadAccountProjects(userId: string): Promise<UserProject[]> {
  const storageKey = portfolioStorageKey(userId);
  const localCache = readStoredProjects(storageKey);
  try {
    const serverProjects = (await fetchAccountProjects()).map(migrateProject);
    persistProjects(serverProjects, storageKey);
    return serverProjects;
  } catch {
    return localCache;
  }
}

export async function mergeGuestProjectsToAccount(userId: string): Promise<UserProject[]> {
  migrateLegacyPortfolioStorage();
  const guestProjects = readStoredProjects(PORTFOLIO_GUEST_STORAGE_KEY);
  const storageKey = portfolioStorageKey(userId);

  try {
    const serverProjects = (await fetchAccountProjects()).map(migrateProject);
    const serverIds = new Set(serverProjects.map((p) => p.id));
    const serverSlugs = new Set(serverProjects.map((p) => p.opportunitySlug));
    const toUpload = guestProjects.filter(
      (p) => !serverIds.has(p.id) && !serverSlugs.has(p.opportunitySlug),
    );

    if (toUpload.length > 0) {
      await Promise.all(toUpload.map((p) => uploadAccountProject(migrateProject(p))));
    }

    clearGuestPortfolioStorage();
    const merged = [...toUpload, ...serverProjects].map(migrateProject);
    persistProjects(merged, storageKey);
    return merged;
  } catch {
    const fallback = guestProjects.length > 0 ? guestProjects : readStoredProjects(storageKey);
    persistProjects(fallback, storageKey);
    return fallback;
  }
}
