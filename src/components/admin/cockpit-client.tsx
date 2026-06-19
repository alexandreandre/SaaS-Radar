"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader, KpiCard } from "@/components/admin/admin-ui";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { adminFetchJson } from "@/lib/admin/client-fetch";
import type { AdminCockpitData } from "@/lib/admin/cockpit";

export function AdminCockpitClient({
  initialData = null,
  initialError = null,
}: {
  initialData?: AdminCockpitData | null;
  initialError?: string | null;
}) {
  const skipFetch = useRef(initialData != null || initialError != null);
  const [data, setData] = useState<AdminCockpitData>(
    initialData ?? {
      note: "",
      projects: [],
      connectors: [],
      stats: { projectCount: 0, connectorSnapshots: 0, demoConnectors: 0 },
    },
  );
  const [loading, setLoading] = useState(!initialData && !initialError);

  const load = useCallback(async () => {
    const { ok, data: json } = await adminFetchJson<AdminCockpitData>("/api/admin/cockpit");
    if (ok) setData(json);
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
