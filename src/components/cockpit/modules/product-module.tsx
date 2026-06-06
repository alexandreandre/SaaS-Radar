"use client";

import dynamic from "next/dynamic";
import { ChartSection, StatCard } from "@/components/cockpit/ui/module-primitives";
import { ChartSkeleton } from "@/components/cockpit/ui/chart-skeleton";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

const AcquisitionFunnelChart = dynamic(
  () => import("@/components/cockpit/metrics/acquisition-funnel").then((m) => m.AcquisitionFunnelChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const RetentionCurveChart = dynamic(
  () => import("@/components/cockpit/metrics/retention-curve").then((m) => m.RetentionCurveChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export function ProductModule({ project, data }: CockpitModuleProps) {
  const latest = data.metrics.latest;
  const history = data.history;
  const posthogStream =
    project.connectorStreams?.posthog ?? project.connectorStreams?.mixpanel;

  const trialToPaid =
    latest && latest.trials > 0
      ? Math.round((latest.customers / latest.trials) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Signups" value={String(latest?.signups ?? 0)} />
        <StatCard label="MAU" value={String(latest?.mau ?? 0)} />
        <StatCard label="DAU" value={String(latest?.dau ?? 0)} />
        <StatCard label="Trial → Paid" value={trialToPaid !== null ? `${trialToPaid} %` : "—"} />
      </div>

      {posthogStream?.type === "product" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Activation" value={`${posthogStream.activationRate} %`} />
          <StatCard label="Rétention D7" value={`${posthogStream.retentionD7} %`} />
          <StatCard label="Feature top" value={posthogStream.featureUsageTop} />
        </div>
      ) : null}

      {latest ? (
        <ChartSection title="Funnel produit">
          <AcquisitionFunnelChart snapshot={latest} />
        </ChartSection>
      ) : null}
      <ChartSection title="Courbe de rétention">
        <RetentionCurveChart history={history} />
      </ChartSection>
    </div>
  );
}
