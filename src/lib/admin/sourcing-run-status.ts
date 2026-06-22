export type SourcingRunStatus =
  | "queued"
  | "running"
  | "ok"
  | "partial"
  | "empty"
  | "error";

export const TERMINAL_RUN_STATUSES: SourcingRunStatus[] = [
  "ok",
  "partial",
  "empty",
  "error",
];

const STATUS_META: Record<
  SourcingRunStatus,
  { label: string; className: string }
> = {
  queued: { label: "En file", className: "bg-slate-500/10 text-slate-700" },
  running: { label: "En cours", className: "bg-blue-500/10 text-blue-700" },
  ok: { label: "Terminé", className: "bg-emerald-500/10 text-emerald-700" },
  partial: { label: "Partiel", className: "bg-amber-500/10 text-amber-700" },
  empty: { label: "Vide", className: "bg-muted text-muted-foreground" },
  error: { label: "Erreur", className: "bg-red-500/10 text-red-700" },
};

export function getRunStatusMeta(status: string, options?: { error?: string | null }) {
  if (options?.error === "Annulé par l'utilisateur") {
    return { label: "Annulé", className: "bg-orange-500/10 text-orange-700" };
  }
  return (
    STATUS_META[status as SourcingRunStatus] ?? {
      label: status,
      className: "bg-muted text-muted-foreground",
    }
  );
}

export function isRunActive(status: string) {
  return status === "queued" || status === "running";
}

export function isRunCancelling(config: unknown): boolean {
  if (!config || typeof config !== "object") return false;
  return (config as Record<string, unknown>).cancel_requested === true;
}

export function isRunTrackableAsActive(run: {
  status: string;
  config?: unknown;
}): boolean {
  return isRunActive(run.status) && !isRunCancelling(run.config);
}

export type RunProgressInput = {
  status: string;
  count_requested: number;
  count_written: number;
  count_discovered?: number | null;
  count_structured?: number | null;
};

export function runWrittenDisplay(run: RunProgressInput): string {
  const req = run.count_requested || 0;
  const raw = run.count_written ?? 0;
  const written = req > 0 ? Math.min(raw, req) : raw;
  return req > 0 ? `${written}/${req}` : String(written);
}

export function runProgressPct(run: RunProgressInput): number {
  if (run.status === "queued") return 2;
  if (!isRunActive(run.status)) return 100;

  const req = run.count_requested || 1;
  const written = Math.min(run.count_written ?? 0, req);
  const structured = run.count_structured ?? 0;
  const discovered = run.count_discovered ?? 0;

  if (written > 0) {
    return Math.min(99, Math.round((written / req) * 100));
  }
  if (structured > 0) {
    return Math.min(99, Math.round((structured / req) * 100));
  }
  if (discovered > 0) {
    const discoveryTarget = Math.max(req * 3, discovered, 1);
    return Math.min(30, Math.round((discovered / discoveryTarget) * 30));
  }
  if (run.status === "running") return 5;
  return 2;
}

export function runProgressLabel(run: RunProgressInput): string {
  const req = run.count_requested || 0;
  const written = req > 0 ? Math.min(run.count_written ?? 0, req) : (run.count_written ?? 0);
  const structured = run.count_structured ?? 0;
  const discovered = run.count_discovered ?? 0;

  if (run.status === "queued") return "En attente de traitement";
  if (written > 0) return `${written}/${req} publiée(s)`;
  if (structured > 0) return `${structured}/${req} structurée(s)`;
  if (discovered > 0) return `Découverte — ${discovered} lead(s)`;
  if (run.status === "running") return "Démarrage du pipeline…";
  return `${written}/${req}`;
}
