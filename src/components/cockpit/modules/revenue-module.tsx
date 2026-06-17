"use client";

import dynamic from "next/dynamic";
import { CreditCard, TrendingUp } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { ChartSection } from "@/components/cockpit/ui/module-primitives";
import { ChartSkeleton } from "@/components/cockpit/ui/chart-skeleton";
import { KpiCard } from "@/components/cockpit/kpi-card";
import { ManualMetricsDialog } from "@/components/cockpit/manual-metrics-dialog";
import { ModuleCalloutsList } from "@/components/cockpit/module-callouts-list";
import { MrrCheckIn } from "@/components/cockpit/mrr-check-in";
import { Button } from "@/components/ui/button";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import { buildModuleCallouts } from "@/lib/cockpit-callouts";
import {
  buildArpuKpi,
  buildNrrKpi,
  formatMonthLabel,
  formatSnapshotSource,
  getFailedPaymentStreams,
  getNetMrr,
  getPaymentStreams,
  hasPaymentConnector,
} from "@/lib/revenue-helpers";

const MrrBreakdownChart = dynamic(
  () => import("@/components/cockpit/metrics/mrr-breakdown-chart").then((m) => m.MrrBreakdownChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const MrrTrajectoryChart = dynamic(
  () => import("@/components/cockpit/mrr-trajectory-chart").then((m) => m.MrrTrajectoryChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const RetentionCurveChart = dynamic(
  () => import("@/components/cockpit/metrics/retention-curve").then((m) => m.RetentionCurveChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function findKpi(kpis: CockpitModuleProps["data"]["metrics"]["kpis"], key: string) {
  return kpis.find((k) => k.key === key);
}

type RevenueEmptyActionsProps = {
  onLogMetrics: CockpitModuleProps["onLogMetrics"];
  onModuleChange: CockpitModuleProps["onModuleChange"];
  showConnectCta: boolean;
};

function RevenueEmptyActions({
  onLogMetrics,
  onModuleChange,
  showConnectCta,
}: RevenueEmptyActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ManualMetricsDialog
        onSubmit={onLogMetrics}
        trigger={
          <Button variant="default" size="sm">
            Saisir mon MRR
          </Button>
        }
      />
      {showConnectCta ? (
        <Button variant="outline" size="sm" onClick={() => onModuleChange("integrations")}>
          Connecter un paiement
        </Button>
      ) : null}
    </div>
  );
}

export function RevenueModule({
  project,
  opportunity,
  data,
  onLogMetrics,
  onRecordMrr,
  onModuleChange,
}: CockpitModuleProps) {
  const history = data.history;
  const { metrics } = data;
  const paymentConnected = hasPaymentConnector(project);
  const paymentStreams = getPaymentStreams(project);
  const failedStreams = getFailedPaymentStreams(paymentStreams);
  const callouts = buildModuleCallouts("revenus", project, opportunity, {
    alerts: data.alerts,
  });

  const mrrKpi = findKpi(metrics.kpis, "mrr");
  const arrKpi = findKpi(metrics.kpis, "arr");
  const churnKpi = findKpi(metrics.kpis, "churn");
  const targetKpi = findKpi(metrics.kpis, "target");
  const arpuKpi = buildArpuKpi(metrics.arpu, history, metrics.previous ?? undefined);
  const nrrKpi = buildNrrKpi(metrics.nrr, history);
  const sourceBadge = metrics.hasDemoData ? "démo" : paymentConnected ? "live" : "manuel";

  const showConnectCta = !paymentConnected;

  return (
    <div className="space-y-6">
      <ModuleCalloutsList callouts={callouts} onModuleChange={onModuleChange} />

      <div className="grid grid-cols-12 gap-3">
        {mrrKpi ? (
          <div className="col-span-12 lg:col-span-7">
            <KpiCard
              kpi={mrrKpi}
              variant="hero"
              sourceBadge={sourceBadge}
              targetProgressPct={metrics.targetProgressPct}
              targetLabel={targetKpi?.value}
            />
          </div>
        ) : null}

        <div className="col-span-12 flex flex-col gap-3 lg:col-span-5">
          <KpiCard kpi={arpuKpi} variant="compact" index={1} />
          <KpiCard kpi={nrrKpi} variant="compact" index={2} />
          {churnKpi ? (
            <KpiCard kpi={churnKpi} variant="compact" index={3} />
          ) : null}
        </div>

        {arrKpi ? (
          <div className="col-span-6 sm:col-span-3">
            <KpiCard kpi={arrKpi} index={4} />
          </div>
        ) : null}
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-data text-[10px] uppercase tracking-data text-primary">
              Check-in mensuel
            </p>
            <h3 className="mt-1 font-semibold">Mettre à jour votre MRR</h3>
          </div>
          {project.checkInStreak > 0 ? (
            <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-700">
              {project.checkInStreak} mois d&apos;affilée
            </span>
          ) : null}
        </div>
        <MrrCheckIn project={project} onRecord={onRecordMrr} compact />
      </section>

      {failedStreams.length > 0 ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-card text-sm">
          <p className="font-medium">Paiements échoués</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {failedStreams.map(({ id, name, stream }) => (
              <li key={id}>
                {name} — {stream.failedPayments} échec{stream.failedPayments > 1 ? "s" : ""} ·{" "}
                {stream.recoveredPayments} récupéré{stream.recoveredPayments > 1 ? "s" : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ChartSection title="MRR breakdown">
        {history.length > 0 ? (
          <MrrBreakdownChart snapshots={history} />
        ) : (
          <div className="py-6 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Connectez un connecteur paiement ou saisissez vos métriques pour voir la décomposition
              MRR.
            </p>
            <div className="mt-4">
              <RevenueEmptyActions
                onLogMetrics={onLogMetrics}
                onModuleChange={onModuleChange}
                showConnectCta={showConnectCta}
              />
            </div>
          </div>
        )}
      </ChartSection>

      <ChartSection
        title="Trajectoire MRR"
        subtitle="Projection fiche Radar vs votre MRR réel"
      >
        {data.chartData.length > 0 ? (
          <MrrTrajectoryChart data={data.chartData} />
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de trajectoire — enregistrez au moins un check-in MRR.
            </p>
            <div className="mt-4">
              <RevenueEmptyActions
                onLogMetrics={onLogMetrics}
                onModuleChange={onModuleChange}
                showConnectCta={showConnectCta}
              />
            </div>
          </div>
        )}
      </ChartSection>

      <ChartSection
        title="Rétention revenus"
        subtitle="Rétention revenu net (100 % − churn MRR mensuel)"
      >
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
                <th className="pb-2">Expansion</th>
                <th className="pb-2">Churn</th>
                <th className="pb-2">Net</th>
                <th className="pb-2">Clients</th>
                <th className="pb-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((s) => {
                const net = getNetMrr(s);
                return (
                  <tr key={s.date} className="border-b border-border last:border-0">
                    <td className="py-2">{formatMonthLabel(s.date)}</td>
                    <td className="py-2 font-data">{formatCurrency(s.mrr)}</td>
                    <td className="py-2">{formatCurrency(s.newMrr)}</td>
                    <td className="py-2 text-emerald-700">{formatCurrency(s.expansionMrr)}</td>
                    <td className="py-2 text-red-600">{formatCurrency(s.churnedMrr)}</td>
                    <td
                      className={cn(
                        "py-2 font-medium tabular-nums",
                        net >= 0 ? "text-emerald-700" : "text-red-600"
                      )}
                    >
                      {net >= 0 ? "+" : "−"}
                      {formatCurrency(Math.abs(net))}
                    </td>
                    <td className="py-2">{s.customers}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {formatSnapshotSource(s.source)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-primary/30 bg-accent/20 px-6 py-12 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-primary/60" />
          <h3 className="mt-4 font-semibold">Aucun historique revenus</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Mettez à jour votre MRR via le check-in ou la saisie manuelle pour alimenter vos
            graphiques et votre historique mensuel.
          </p>
          <div className="mt-6">
            <RevenueEmptyActions
              onLogMetrics={onLogMetrics}
              onModuleChange={onModuleChange}
              showConnectCta={showConnectCta}
            />
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <ManualMetricsDialog onSubmit={onLogMetrics} />
      </div>
    </div>
  );
}
