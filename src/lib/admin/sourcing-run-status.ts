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

export function getRunStatusMeta(status: string) {
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

export function runProgressPct(run: {
  status: string;
  count_requested: number;
  count_written: number;
}) {
  if (run.status === "queued") return 5;
  if (!isRunActive(run.status)) return 100;
  const req = run.count_requested || 1;
  return Math.min(100, Math.round((run.count_written / req) * 100));
}
