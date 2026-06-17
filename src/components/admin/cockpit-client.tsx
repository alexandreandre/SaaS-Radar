"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, KpiCard } from "@/components/admin/admin-ui";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { adminFetchJson } from "@/lib/admin/client-fetch";

export function AdminCockpitClient() {
  const [data, setData] = useState<{
    note?: string;
    stats?: { projectCount: number; connectorSnapshots: number; demoConnectors: number };
  }>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { ok, data: json } = await adminFetchJson<{
      note?: string;
      stats?: { projectCount: number; connectorSnapshots: number; demoConnectors: number };
    }>("/api/admin/cockpit");
    if (ok) setData(json);
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
        title="Cockpit & connecteurs"
        description="Observabilité usage builder (sync serveur en préparation)."
      />
      <p className="mb-6 text-sm text-muted-foreground">{data.note}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Projets serveur" value={data.stats?.projectCount ?? 0} />
        <KpiCard label="Snapshots connecteurs" value={data.stats?.connectorSnapshots ?? 0} />
        <KpiCard label="Connecteurs démo" value={data.stats?.demoConnectors ?? 0} />
      </div>
    </div>
  );
}
