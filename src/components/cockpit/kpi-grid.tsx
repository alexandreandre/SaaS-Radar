import type { CockpitKpi } from "@/lib/cockpit-metrics";
import { KpiCard } from "@/components/cockpit/kpi-card";

export function KpiGrid({ kpis }: { kpis: CockpitKpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpis.slice(0, 8).map((kpi, i) => (
        <KpiCard key={kpi.key} kpi={kpi} index={i} />
      ))}
    </div>
  );
}
