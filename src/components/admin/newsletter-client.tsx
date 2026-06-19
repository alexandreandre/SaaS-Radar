"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader, AdminTable, KpiCard } from "@/components/admin/admin-ui";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { adminFetchJson } from "@/lib/admin/client-fetch";
import type { AdminNewsletterData } from "@/lib/admin/newsletter";

export function AdminNewsletterClient({
  initialData = null,
  initialError = null,
}: {
  initialData?: AdminNewsletterData | null;
  initialError?: string | null;
}) {
  const skipFetch = useRef(initialData != null || initialError != null);
  const [stats, setStats] = useState(initialData?.stats ?? { total: 0, active: 0, pending: 0 });
  const [subscribers, setSubscribers] = useState<Record<string, unknown>[]>(
    initialData?.subscribers ?? [],
  );
  const [loading, setLoading] = useState(!initialData && !initialError);

  const load = useCallback(async () => {
    const { ok, data: json } = await adminFetchJson<AdminNewsletterData>("/api/admin/newsletter");
    if (ok) {
      setStats(json.stats ?? { total: 0, active: 0, pending: 0 });
      setSubscribers(json.subscribers ?? []);
    }
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
    return <AdminPageSkeleton kpiCount={3} />;
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
