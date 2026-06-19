import {
  migrateProject,
  PORTFOLIO_STORAGE_KEY,
  PENDING_PROJECT_STORAGE_KEY,
  type UserProject,
} from "@/lib/portfolio";

/** Cache local invité (avant connexion). */
export const PORTFOLIO_GUEST_STORAGE_KEY = "saas-radar:portfolio:guest";

export function portfolioStorageKey(userId: string): string {
  return `saas-radar:portfolio:${userId}`;
}

/** Ancienne clé globale → cache invité (une seule fois). */
export function migrateLegacyPortfolioStorage(): void {
  if (typeof window === "undefined") return;
  const legacy = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
  if (!legacy) return;
  if (!localStorage.getItem(PORTFOLIO_GUEST_STORAGE_KEY)) {
    localStorage.setItem(PORTFOLIO_GUEST_STORAGE_KEY, legacy);
  }
  localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
}

export function readStoredProjects(storageKey: string): UserProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as UserProject[]) : [];
    const base = Array.isArray(parsed) ? parsed.map(migrateProject) : [];

    const pendingRaw = sessionStorage.getItem(PENDING_PROJECT_STORAGE_KEY);
    if (!pendingRaw) return base;

    const pending = migrateProject(JSON.parse(pendingRaw) as UserProject);
    sessionStorage.removeItem(PENDING_PROJECT_STORAGE_KEY);
    if (base.some((p) => p.id === pending.id)) {
      return base.map((p) => (p.id === pending.id ? pending : p));
    }
    return [pending, ...base];
  } catch {
    return [];
  }
}

export function persistProjects(projects: UserProject[], storageKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(projects));
}

export function clearGuestPortfolioStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PORTFOLIO_GUEST_STORAGE_KEY);
}
