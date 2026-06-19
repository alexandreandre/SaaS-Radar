import { migrateProject, type UserProject } from "@/lib/portfolio";

export function queueProjectSync(project: UserProject) {
  if (typeof window === "undefined") return;

  const payload = migrateProject(project);
  void fetch("/api/portfolio/metrics", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function queueProjectDelete(projectId: string) {
  if (typeof window === "undefined") return;

  void fetch(`/api/portfolio/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  }).catch(() => {});
}

/** @deprecated Utiliser queueProjectSync */
export function queueProjectMetricsSync(project: UserProject) {
  queueProjectSync(project);
}

export async function fetchAccountProjects(): Promise<UserProject[]> {
  const res = await fetch("/api/portfolio");
  if (!res.ok) return [];
  const data = (await res.json()) as { projects?: UserProject[] };
  return Array.isArray(data.projects) ? data.projects : [];
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
