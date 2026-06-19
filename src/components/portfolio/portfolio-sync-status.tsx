"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { usePortfolioSyncState } from "@/hooks/use-portfolio-sync-state";
import { cn } from "@/lib/utils";

const LABELS = {
  idle: null,
  syncing: "Synchronisation…",
  synced: "Sauvegardé",
  error: "Hors ligne — réessai",
} as const;

export function PortfolioSyncStatus({
  projectId,
  className,
}: {
  projectId?: string;
  className?: string;
}) {
  const status = usePortfolioSyncState(projectId);
  const label = LABELS[status];
  if (!label) return null;

  const Icon =
    status === "syncing" ? Loader2 : status === "error" ? CloudOff : Cloud;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-data text-[10px] uppercase tracking-data",
        status === "error" ? "text-amber-500" : "text-muted-foreground",
        className,
      )}
      role="status"
    >
      <Icon
        className={cn("h-3 w-3", status === "syncing" && "animate-spin")}
        aria-hidden
      />
      {label}
    </span>
  );
}
