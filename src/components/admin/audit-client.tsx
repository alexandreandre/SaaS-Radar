"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-ui";

type LogRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

export function AdminAuditClient() {
  const [logs, setLogs] = useState<LogRow[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/audit");
    const json = await res.json();
    if (res.ok) setLogs(json.logs ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
