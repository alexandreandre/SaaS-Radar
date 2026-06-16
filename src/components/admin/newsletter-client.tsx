"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, AdminTable, KpiCard } from "@/components/admin/admin-ui";

export function AdminNewsletterClient() {
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });
  const [subscribers, setSubscribers] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/newsletter");
    const json = await res.json();
    if (res.ok) {
      setStats(json.stats);
      setSubscribers(json.subscribers ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        description="Abonnés réels et gestion des inscriptions (remplace les stats mockées)."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total" value={stats.total} />
        <KpiCard label="Actifs" value={stats.active} />
        <KpiCard label="En attente" value={stats.pending} />
      </div>
      <AdminTable headers={["Email", "Statut", "Source", "Inscrit le"]}>
        {subscribers.map((s) => (
          <tr key={String(s.id)} className="border-t border-border">
            <td className="px-3 py-2">{String(s.email)}</td>
            <td className="px-3 py-2">{String(s.status)}</td>
            <td className="px-3 py-2">{String(s.source ?? "—")}</td>
            <td className="px-3 py-2 text-xs text-muted-foreground">
              {new Date(String(s.created_at)).toLocaleDateString("fr-FR")}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
