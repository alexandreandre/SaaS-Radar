"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ExpenseTable } from "@/components/cockpit/expenses/expense-table";
import { ChartSection, StatCard } from "@/components/cockpit/ui/module-primitives";
import { ChartSkeleton } from "@/components/cockpit/ui/chart-skeleton";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

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
  data,
  onAddExpense,
  onRemoveExpense,
  onSetCashOnHand,
}: CockpitModuleProps) {
  const expenses = project.expenses ?? [];
  const cashOnHand = project.cashOnHand ?? 5000;
  const qontoStream = project.connectorStreams?.qonto;
  const accountingStream =
    project.connectorStreams?.pennylane ?? project.connectorStreams?.abby;
  const latestMrr = data.metrics.latest?.mrr ?? project.currentMrr;

  const qontoMismatch =
    qontoStream?.type === "finance" &&
    Math.abs(qontoStream.cashBalance - cashOnHand) / Math.max(cashOnHand, 1) > 0.1;

  return (
    <div className="space-y-6">
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

      {qontoMismatch ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          Écart Qonto ({formatCurrency(qontoStream!.cashBalance)}) vs saisie manuelle (
          {formatCurrency(cashOnHand)}).
        </div>
      ) : null}

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
