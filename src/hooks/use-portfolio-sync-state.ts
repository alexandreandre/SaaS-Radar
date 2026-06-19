"use client";

import { useEffect, useState } from "react";
import {
  getGlobalSyncStatus,
  getProjectSyncStatus,
  subscribeProjectSync,
  type ProjectSyncStatus,
} from "@/lib/portfolio-sync-queue";

export function usePortfolioSyncState(projectId?: string): ProjectSyncStatus {
  const [status, setStatus] = useState<ProjectSyncStatus>(() =>
    projectId ? getProjectSyncStatus(projectId) : getGlobalSyncStatus(),
  );

  useEffect(() => {
    const update = (id: string, next: ProjectSyncStatus) => {
      if (projectId) {
        if (id === projectId) setStatus(next);
      } else {
        setStatus(getGlobalSyncStatus());
      }
    };
    return subscribeProjectSync(update);
  }, [projectId]);

  return status;
}
