import type { CockpitMetrics } from "@/lib/cockpit-metrics";
import { KpiCard } from "@/components/cockpit/kpi-card";

const HERO_KEY = "mrr";
const QUICK_KEYS = ["runway", "roas", "customers"] as const;
const SECONDARY_KEYS = ["arr", "churn", "ltvCac", "mau"] as const;

function findKpi(kpis: CockpitMetrics["kpis"], key: string) {
  return kpis.find((k) => k.key === key);
}

export function KpiGrid({ metrics }: { metrics: CockpitMetrics }) {
  const { kpis, hasDemoData, targetProgressPct, runwayMonths } = metrics;

  const heroKpi = findKpi(kpis, HERO_KEY);
  const targetKpi = findKpi(kpis, "target");
  const quickKpis = QUICK_KEYS.map((key) => findKpi(kpis, key)).filter(Boolean);
  const secondaryKpis = SECONDARY_KEYS.map((key) => findKpi(kpis, key)).filter(Boolean);

  const mrrBadge = hasDemoData ? "démo" : "live";
  const customersBadge = hasDemoData ? "sync" : "manuel";

  return (
    <div className="grid grid-cols-12 gap-3">
      {heroKpi ? (
        <div className="col-span-12 lg:col-span-7">
          <KpiCard
            kpi={heroKpi}
            index={0}
            variant="hero"
            sourceBadge={mrrBadge}
            targetProgressPct={targetProgressPct}
            targetLabel={targetKpi?.value}
          />
        </div>
      ) : null}

      {quickKpis.length > 0 ? (
        <div className="col-span-12 flex flex-col gap-3 lg:col-span-5">
          {quickKpis.map((kpi, i) => (
            <KpiCard
              key={kpi!.key}
              kpi={kpi!}
              index={i + 1}
              variant="compact"
              sourceBadge={kpi!.key === "customers" ? customersBadge : undefined}
              runwayMonths={kpi!.key === "runway" ? runwayMonths : undefined}
            />
          ))}
        </div>
      ) : null}

      {secondaryKpis.map((kpi, i) => (
        <div key={kpi!.key} className="col-span-6 sm:col-span-3">
          <KpiCard
            kpi={kpi!}
            index={i + 4}
            runwayMonths={kpi!.key === "runway" ? runwayMonths : undefined}
          />
        </div>
      ))}
    </div>
  );
}
