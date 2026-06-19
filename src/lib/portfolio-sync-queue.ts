import type { UserProject } from "@/lib/portfolio";
import { migrateProject } from "@/lib/portfolio";

export type ProjectSyncStatus = "idle" | "syncing" | "synced" | "error";

type QueueEntry = {
  project: UserProject;
  attempts: number;
  status: ProjectSyncStatus;
  lastError?: string;
};

type SyncListener = (projectId: string, status: ProjectSyncStatus) => void;

const STORAGE_KEY = "saas-radar:portfolio-sync-queue";
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 800;

let queue: QueueEntry[] = [];
const listeners = new Set<SyncListener>();
const statusByProject = new Map<string, ProjectSyncStatus>();

function persistQueue(): void {
  if (typeof window === "undefined") return;
  try {
    const payload = queue.map((e) => ({
      project: e.project,
      attempts: e.attempts,
      status: e.status,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota
  }
}

function restoreQueue(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Array<{
      project: UserProject;
      attempts: number;
      status: ProjectSyncStatus;
    }>;
    queue = parsed.map((e) => ({
      project: migrateProject(e.project),
      attempts: e.attempts,
      status: e.status === "syncing" ? "error" : e.status,
    }));
    for (const e of queue) {
      statusByProject.set(e.project.id, e.status);
    }
  } catch {
    queue = [];
  }
}

function notify(projectId: string, status: ProjectSyncStatus): void {
  statusByProject.set(projectId, status);
  for (const fn of Array.from(listeners)) fn(projectId, status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadProject(project: UserProject): Promise<{ ok: boolean; updatedAt?: string }> {
  const payload = migrateProject(project);
  const res = await fetch("/api/portfolio/metrics", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `Sync HTTP ${res.status}`);
  }
  const json = (await res.json()) as { ok?: boolean; updatedAt?: string };
  return { ok: true, updatedAt: json.updatedAt };
}

let processing = false;

async function processQueue(): Promise<void> {
  if (processing || typeof window === "undefined") return;
  processing = true;

  try {
    while (queue.length > 0) {
      const entry = queue[0]!;
      notify(entry.project.id, "syncing");

      try {
        await uploadProject(entry.project);
        queue.shift();
        notify(entry.project.id, "synced");
        persistQueue();
        await delay(100);
      } catch (err) {
        entry.attempts += 1;
        entry.lastError = err instanceof Error ? err.message : String(err);
        if (entry.attempts >= MAX_ATTEMPTS) {
          queue.shift();
          notify(entry.project.id, "error");
        } else {
          notify(entry.project.id, "error");
          await delay(BASE_DELAY_MS * 2 ** (entry.attempts - 1));
        }
        persistQueue();
      }
    }
  } finally {
    processing = false;
  }
}

export function subscribeProjectSync(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProjectSyncStatus(projectId: string): ProjectSyncStatus {
  return statusByProject.get(projectId) ?? "idle";
}

export function getGlobalSyncStatus(): ProjectSyncStatus {
  if (queue.some((e) => e.status === "error" || e.attempts > 0)) return "error";
  if (processing || queue.some((e) => e.status === "syncing")) return "syncing";
  if (queue.length === 0 && Array.from(statusByProject.values()).every((s) => s === "synced" || s === "idle")) {
    return "synced";
  }
  return "idle";
}

export function enqueueProjectSync(project: UserProject): void {
  if (typeof window === "undefined") return;
  restoreQueue();

  const payload = migrateProject(project);
  const existingIdx = queue.findIndex((e) => e.project.id === payload.id);
  const entry: QueueEntry = {
    project: payload,
    attempts: existingIdx >= 0 ? queue[existingIdx]!.attempts : 0,
    status: "syncing",
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = entry;
  } else {
    queue.push(entry);
  }

  persistQueue();
  notify(payload.id, "syncing");
  void processQueue();
}

export function enqueueProjectDelete(projectId: string): void {
  if (typeof window === "undefined") return;

  queue = queue.filter((e) => e.project.id !== projectId);
  persistQueue();

  void fetch(`/api/portfolio/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  }).catch(() => {
    notify(projectId, "error");
  });
}

/** Reprise après refresh navigateur. */
export function flushPortfolioSyncQueue(): void {
  restoreQueue();
  if (queue.length > 0) void processQueue();
}
