"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-ui";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { adminFetchJson } from "@/lib/admin/client-fetch";

type LogRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

type AuditInitialData = {
  logs: Record<string, unknown>[];
  total: number;
};

export function AdminAuditClient({
  initialData = null,
  initialError = null,
}: {
  initialData?: AuditInitialData | null;
  initialError?: string | null;
}) {
  const skipFetch = useRef(initialData != null || initialError != null);
  const [logs, setLogs] = useState<LogRow[]>(
    () => (initialData?.logs as LogRow[] | undefined) ?? [],
  );
  const [loading, setLoading] = useState(!initialData && !initialError);

  const load = useCallback(async () => {
    const { ok, data: json } = await adminFetchJson<{ logs?: LogRow[] }>("/api/admin/audit");
    if (ok) setLogs(json.logs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    void load();
  }, [load]);

  if (loading) {
    return <AdminPageSkeleton kpiCount={0} />;
  }

  if (initialError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {initialError}
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Journal d'audit"
        description="Trace de toutes les actions admin sensibles."
      />
      <AdminTable headers={["Date", "Acteur", "Action", "Cible", "ID"]}>
        {logs.map((log) => (
          <tr key={log.id} className="border-t border-border">
            <td className="px-3 py-2 text-xs text-muted-foreground">
              {new Date(log.created_at).toLocaleString("fr-FR")}
            </td>
            <td className="px-3 py-2 text-xs">{log.actor_email ?? "—"}</td>
            <td className="px-3 py-2 font-mono text-xs">{log.action}</td>
            <td className="px-3 py-2 text-xs">{log.target_type ?? "—"}</td>
            <td className="px-3 py-2 font-mono text-xs">{log.target_id ?? "—"}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
