"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ExpenseTable } from "@/components/cockpit/expenses/expense-table";
import { ModuleCalloutsList } from "@/components/cockpit/module-callouts-list";
import { ChartSection, StatCard } from "@/components/cockpit/ui/module-primitives";
import { ChartSkeleton } from "@/components/cockpit/ui/chart-skeleton";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import { buildModuleCallouts } from "@/lib/cockpit-callouts";

const ExpenseDonutChart = dynamic(
  () => import("@/components/cockpit/metrics/expense-donut").then((m) => m.ExpenseDonutChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const RunwayChart = dynamic(
  () => import("@/components/cockpit/metrics/runway-chart").then((m) => m.RunwayChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const CashFlowChart = dynamic(
  () => import("@/components/cockpit/metrics/cash-flow-chart").then((m) => m.CashFlowChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const AccountingVsMrrChart = dynamic(
  () =>
    import("@/components/cockpit/metrics/accounting-vs-mrr-chart").then(
      (m) => m.AccountingVsMrrChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export function FinanceModule({
  project,
  opportunity,
  data,
  onAddExpense,
  onRemoveExpense,
  onSetCashOnHand,
  onModuleChange,
}: CockpitModuleProps) {
  const expenses = project.expenses ?? [];
  const cashOnHand = project.cashOnHand ?? 5000;
  const qontoStream = project.connectorStreams?.qonto;
  const accountingStream =
    project.connectorStreams?.pennylane ?? project.connectorStreams?.abby;
  const latestMrr = data.metrics.latest?.mrr ?? project.currentMrr;
  const callouts = buildModuleCallouts("finance", project, opportunity, {
    alerts: data.alerts,
  });

  return (
    <div className="space-y-6">
      <ModuleCalloutsList callouts={callouts} onModuleChange={onModuleChange} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Trésorerie"
          value={formatCurrency(
            qontoStream?.type === "finance" ? qontoStream.cashBalance : cashOnHand
          )}
        />
        <StatCard label="Burn rate / mois" value={formatCurrency(data.metrics.burnRate)} />
        <StatCard
          label="Runway"
          value={data.metrics.runwayMonths !== null ? `${data.metrics.runwayMonths} mois` : "—"}
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <Label htmlFor="cash">Trésorerie disponible (€)</Label>
        <input
          id="cash"
          type="number"
          defaultValue={cashOnHand}
          onBlur={(e) => onSetCashOnHand(Number(e.target.value) || 0)}
          className="mt-2 flex h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm"
        />
      </section>

      {qontoStream?.type === "finance" ? (
        <ChartSection title="Flux trésorerie (Qonto)">
          <CashFlowChart stream={qontoStream} />
        </ChartSection>
      ) : null}

      {accountingStream?.type === "accounting" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="CA comptable"
              value={formatCurrency(accountingStream.revenueBooked)}
            />
            <StatCard
              label="Charges comptables"
              value={formatCurrency(accountingStream.expensesBooked)}
            />
            <StatCard label="TVA due" value={formatCurrency(accountingStream.vatDue)} />
          </div>
          <ChartSection title="CA comptable vs MRR Stripe">
            <AccountingVsMrrChart mrr={latestMrr} accounting={accountingStream} />
          </ChartSection>
        </>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSection title="Répartition des dépenses">
          <ExpenseDonutChart expenses={expenses} />
        </ChartSection>
        <ChartSection title="Projection runway">
          <RunwayChart cashOnHand={cashOnHand} burnRate={data.metrics.burnRate} />
        </ChartSection>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <ExpenseTable expenses={expenses} onAdd={onAddExpense} onRemove={onRemoveExpense} />
      </section>
    </div>
  );
}
