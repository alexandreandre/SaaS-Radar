"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminTable, KpiCard } from "@/components/admin/admin-ui";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { adminFetchJson } from "@/lib/admin/client-fetch";
import type { AdminBillingData } from "@/lib/admin/billing";

type Metrics = AdminBillingData["metrics"];

export function AdminBillingClient({
  initialData = null,
  initialError = null,
}: {
  initialData?: AdminBillingData | null;
  initialError?: string | null;
}) {
  const skipFetch = useRef(initialData != null || initialError != null);
  const [metrics, setMetrics] = useState<Metrics | null>(initialData?.metrics ?? null);
  const [subscribers, setSubscribers] = useState<Record<string, unknown>[]>(
    initialData?.subscribers ?? [],
  );
  const [loading, setLoading] = useState(!initialData && !initialError);

  const load = useCallback(async () => {
    const { ok, data: json } = await adminFetchJson<{
      metrics?: Metrics;
      subscribers?: Record<string, unknown>[];
    }>("/api/admin/billing");
    if (ok) {
      setMetrics(json.metrics ?? null);
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

  const snapshot = async () => {
    await adminFetchJson("/api/admin/billing", { method: "POST" });
    setLoading(true);
    void load();
  };

  const fmt = (cents: number) => `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;

  if (loading && !metrics) {
    return <AdminPageSkeleton kpiCount={4} />;
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
        title="Abonnements & revenus"
        description="MRR, répartition des plans et abonnés Stripe."
        actions={
          <Button variant="outline" onClick={() => void snapshot()}>
            Créer snapshot
          </Button>
        }
      />
      {metrics && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="MRR" value={fmt(metrics.mrrCents)} />
          <KpiCard label="ARR" value={fmt(metrics.arrCents)} />
          <KpiCard label="Abonnés actifs" value={metrics.activeSubscribers} />
          <KpiCard label="Past due" value={metrics.pastDueCount} />
        </div>
      )}
      <AdminTable headers={["Email", "Plan", "Statut", "Intervalle", "Fin période"]}>
        {subscribers.map((s) => (
          <tr key={String(s.id)} className="border-t border-border">
            <td className="px-3 py-2">{String(s.email ?? "—")}</td>
            <td className="px-3 py-2">{String(s.plan)}</td>
            <td className="px-3 py-2">{String(s.subscription_status ?? "—")}</td>
            <td className="px-3 py-2">{String(s.billing_interval ?? "—")}</td>
            <td className="px-3 py-2 text-xs text-muted-foreground">
              {s.current_period_end
                ? new Date(String(s.current_period_end)).toLocaleDateString("fr-FR")
                : "—"}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
