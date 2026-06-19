import { migrateProject, type UserProject } from "@/lib/portfolio";
import {
  enqueueProjectDelete,
  enqueueProjectSync,
  flushPortfolioSyncQueue,
} from "@/lib/portfolio-sync-queue";

export { flushPortfolioSyncQueue };

export function queueProjectSync(project: UserProject): void {
  enqueueProjectSync(project);
}

export function queueProjectDelete(projectId: string): void {
  enqueueProjectDelete(projectId);
}

/** @deprecated Utiliser queueProjectSync */
export function queueProjectMetricsSync(project: UserProject): void {
  queueProjectSync(project);
}

export async function fetchAccountProjects(): Promise<UserProject[]> {
  const res = await fetch("/api/portfolio");
  if (!res.ok) return [];
  const data = (await res.json()) as { projects?: UserProject[] };
  return Array.isArray(data.projects) ? data.projects.map(migrateProject) : [];
}

export async function uploadAccountProject(project: UserProject): Promise<boolean> {
  const payload = migrateProject(project);
  const res = await fetch("/api/portfolio/metrics", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}
