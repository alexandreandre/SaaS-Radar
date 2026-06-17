"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, AdminTable, KpiCard } from "@/components/admin/admin-ui";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { adminFetchJson } from "@/lib/admin/client-fetch";

export function AdminNewsletterClient() {
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });
  const [subscribers, setSubscribers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { ok, data: json } = await adminFetchJson<{
      stats?: { total: number; active: number; pending: number };
      subscribers?: Record<string, unknown>[];
    }>("/api/admin/newsletter");
    if (ok) {
      setStats(json.stats ?? { total: 0, active: 0, pending: 0 });
      setSubscribers(json.subscribers ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <AdminPageSkeleton kpiCount={3} />;
  }

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
