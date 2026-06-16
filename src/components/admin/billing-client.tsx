"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminTable, KpiCard } from "@/components/admin/admin-ui";

type Metrics = {
  mrrCents: number;
  arrCents: number;
  activeSubscribers: number;
  freeCount: number;
  builderCount: number;
  proCount: number;
  pastDueCount: number;
};

export function AdminBillingClient() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [subscribers, setSubscribers] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/billing");
    const json = await res.json();
    if (res.ok) {
      setMetrics(json.metrics);
      setSubscribers(json.subscribers ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = async () => {
    await fetch("/api/admin/billing", { method: "POST" });
    void load();
  };

  const fmt = (cents: number) => `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;

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
