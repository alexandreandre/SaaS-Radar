"use client";

import { useEffect, useRef } from "react";
import { AUTO_SYNC_SESSION_COOLDOWN_MS } from "@/lib/connectors/auto-sync";
import { usePortfolio } from "@/contexts/portfolio-context";

const sessionLastAttempt = new Map<string, number>();

function canAttemptSessionSync(projectId: string): boolean {
  const last = sessionLastAttempt.get(projectId) ?? 0;
  return Date.now() - last >= AUTO_SYNC_SESSION_COOLDOWN_MS;
}

function markSessionSyncAttempt(projectId: string): void {
  sessionLastAttempt.set(projectId, Date.now());
}

export function useAutoSyncIntegrations(projectId: string): void {
  const { hydrated, syncProjectIntegrations } = usePortfolio();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!hydrated || !projectId) return;

    let cancelled = false;

    const run = async () => {
      if (runningRef.current || !canAttemptSessionSync(projectId)) return;
      runningRef.current = true;
      markSessionSyncAttempt(projectId);
      try {
        await syncProjectIntegrations(projectId);
      } finally {
        if (!cancelled) runningRef.current = false;
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [hydrated, projectId, syncProjectIntegrations]);

  useEffect(() => {
    if (!hydrated || !projectId) return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (runningRef.current || !canAttemptSessionSync(projectId)) return;

      runningRef.current = true;
      markSessionSyncAttempt(projectId);
      void syncProjectIntegrations(projectId).finally(() => {
        runningRef.current = false;
      });
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [hydrated, projectId, syncProjectIntegrations]);
}
