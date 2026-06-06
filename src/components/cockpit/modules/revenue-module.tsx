"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils";
import { ChartSection, StatCard } from "@/components/cockpit/ui/module-primitives";
import { ChartSkeleton } from "@/components/cockpit/ui/chart-skeleton";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

const MrrBreakdownChart = dynamic(
  () => import("@/components/cockpit/metrics/mrr-breakdown-chart").then((m) => m.MrrBreakdownChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const ArrLineChart = dynamic(
  () => import("@/components/cockpit/metrics/arr-line-chart").then((m) => m.ArrLineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const RetentionCurveChart = dynamic(
  () => import("@/components/cockpit/metrics/retention-curve").then((m) => m.RetentionCurveChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export function RevenueModule({ project, data }: CockpitModuleProps) {
  const latest = data.metrics.latest;
  const history = data.history;
  const stripeStream = project.connectorStreams?.stripe;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="MRR" value={formatCurrency(latest?.mrr ?? project.currentMrr)} />
        <StatCard label="ARR" value={formatCurrency(data.metrics.arr)} />
        <StatCard label="ARPU" value={formatCurrency(data.metrics.arpu)} />
        <StatCard label="NRR" value={`${data.metrics.nrr} %`} />
      </div>

      {stripeStream?.type === "payment" ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-card text-sm">
          <p className="font-medium">Stripe — paiements échoués</p>
          <p className="mt-1 text-muted-foreground">
            {stripeStream.failedPayments} échecs · {stripeStream.recoveredPayments} récupérés
          </p>
        </section>
      ) : null}

      <ChartSection title="MRR breakdown">
        <MrrBreakdownChart snapshots={history} />
      </ChartSection>
      <ChartSection title="Courbe ARR">
        <ArrLineChart snapshots={history} />
      </ChartSection>
      <ChartSection title="Rétention revenus">
        <RetentionCurveChart history={history} />
      </ChartSection>

      {history.length > 0 ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card overflow-x-auto">
          <h3 className="font-semibold">Historique mensuel</h3>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2">Mois</th>
                <th className="pb-2">MRR</th>
                <th className="pb-2">Nouveau</th>
                <th className="pb-2">Churn</th>
                <th className="pb-2">Clients</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((s) => (
                <tr key={s.date} className="border-b border-border last:border-0">
                  <td className="py-2">{s.date}</td>
                  <td className="py-2 font-data">{formatCurrency(s.mrr)}</td>
                  <td className="py-2">{formatCurrency(s.newMrr)}</td>
                  <td className="py-2 text-red-600">{formatCurrency(s.churnedMrr)}</td>
                  <td className="py-2">{s.customers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
