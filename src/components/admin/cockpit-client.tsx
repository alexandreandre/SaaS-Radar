"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, KpiCard } from "@/components/admin/admin-ui";

export function AdminCockpitClient() {
  const [data, setData] = useState<{
    note?: string;
    stats?: { projectCount: number; connectorSnapshots: number; demoConnectors: number };
  }>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/cockpit");
    const json = await res.json();
    if (res.ok) setData(json);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
