"use client";

import dynamic from "next/dynamic";
import { KpiCard } from "@/components/cockpit/kpi-card";
import { ManualMetricsDialog } from "@/components/cockpit/manual-metrics-dialog";
import { ModuleCalloutsList } from "@/components/cockpit/module-callouts-list";
import { ChartSection, StatCard } from "@/components/cockpit/ui/module-primitives";
import { ChartSkeleton } from "@/components/cockpit/ui/chart-skeleton";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import type { CockpitKpi } from "@/lib/cockpit-metrics";
import { buildModuleCallouts } from "@/lib/cockpit-callouts";
import {
  getProductStream,
  hasProductAnalyticsConnected,
} from "@/lib/connectors/streams";
import { computeStickiness, getEngagementSeries } from "@/lib/portfolio";

const EngagementTrendChart = dynamic(
  () =>
    import("@/components/cockpit/metrics/engagement-trend-chart").then((m) => m.EngagementTrendChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const ProductFunnelChart = dynamic(
  () => import("@/components/cockpit/metrics/product-funnel-chart").then((m) => m.ProductFunnelChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function findProductKpi(kpis: CockpitKpi[], key: string) {
  return kpis.find((k) => k.key === key);
}

export function ProductModule({
  project,
  opportunity,
  data,
  onLogMetrics,
  onModuleChange,
}: CockpitModuleProps) {
  const latest = data.metrics.latest;
  const history = data.history;
  const productKpis = data.metrics.productKpis.kpis;
  const productStream = getProductStream(project.connectorStreams);
  const hasAnalytics = hasProductAnalyticsConnected(project.integrations);
  const sourceBadge = data.metrics.hasDemoData ? "démo" : hasAnalytics ? "sync" : "manuel";
  const callouts = buildModuleCallouts("produit", project, opportunity, {
    alerts: data.alerts,
  });

  const heroKpi = findProductKpi(productKpis, "mau");
  const stickinessKpi = findProductKpi(productKpis, "stickiness");
  const secondaryKeys = ["signups", "trials", "dau", "activeUsers", "trialToPaid"] as const;
  const secondaryKpis = secondaryKeys
    .map((key) => findProductKpi(productKpis, key))
    .filter(Boolean) as CockpitKpi[];

  const engagementHistory = getEngagementSeries(history);
  const hasEngagementData = engagementHistory.some(
    (row) => row.signups > 0 || row.mau > 0 || row.dau > 0
  );

  return (
    <div className="space-y-6">
      <ModuleCalloutsList callouts={callouts} onModuleChange={onModuleChange} />

      <div className="grid grid-cols-12 gap-3">
        {heroKpi ? (
          <div className="col-span-12 lg:col-span-7">
            <KpiCard kpi={heroKpi} index={0} variant="hero" sourceBadge={sourceBadge} />
          </div>
        ) : null}
        {stickinessKpi ? (
          <div className="col-span-12 lg:col-span-5">
            <KpiCard kpi={stickinessKpi} index={1} variant="compact" sourceBadge={sourceBadge} />
          </div>
        ) : null}
        {secondaryKpis.map((kpi, i) => (
          <div key={kpi.key} className="col-span-6 sm:col-span-4 lg:col-span-4 xl:col-span-2">
            <KpiCard kpi={kpi} index={i + 2} sourceBadge={kpi.key === "signups" ? sourceBadge : undefined} />
          </div>
        ))}
      </div>

      {productStream ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Analytics in-app</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Données PostHog, Mixpanel ou Fathom — distinctes de la rétention revenus (MRR).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Activation (in-app)" value={`${productStream.activationRate} %`} />
            <StatCard label="Rétention J7 (cohorte)" value={`${productStream.retentionD7} %`} />
            <StatCard
              label="Feature la plus utilisée"
              value={productStream.featureUsageTop}
            />
          </div>
        </section>
      ) : null}

      <ChartSection title="Tendance engagement">
        {hasEngagementData ? (
          <EngagementTrendChart history={history} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Saisissez signups, MAU ou DAU pour voir l&apos;évolution mensuelle.
          </p>
        )}
      </ChartSection>

      {latest ? (
        <ChartSection title="Funnel signup → client">
          <ProductFunnelChart snapshot={latest} productStream={productStream} />
          <p className="mt-3 text-xs text-muted-foreground">
            Funnel marketing complet (impressions, pub) :{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => onModuleChange("acquisition")}
            >
              voir Acquisition
            </button>
          </p>
        </ChartSection>
      ) : null}

      {history.length > 0 ? (
        <section className="overflow-x-auto rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Historique engagement</h3>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2">Mois</th>
                <th className="pb-2">Signups</th>
                <th className="pb-2">Trials</th>
                <th className="pb-2">MAU</th>
                <th className="pb-2">DAU</th>
                <th className="pb-2">Stickiness</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((s) => {
                const stickiness = computeStickiness(s.dau, s.mau);
                return (
                  <tr key={s.date} className="border-b border-border last:border-0">
                    <td className="py-2">{s.date}</td>
                    <td className="py-2 font-data">{s.signups}</td>
                    <td className="py-2 font-data">{s.trials}</td>
                    <td className="py-2 font-data">{s.mau}</td>
                    <td className="py-2 font-data">{s.dau}</td>
                    <td className="py-2 font-data">
                      {stickiness !== null ? `${stickiness} %` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Rétention revenus (MRR) :{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => onModuleChange("revenus")}
            >
              voir Revenus
            </button>
          </p>
        </section>
      ) : null}

      <div className="flex justify-end">
        <ManualMetricsDialog focus="product" onSubmit={onLogMetrics} />
      </div>
    </div>
  );
}
