"use client";

import dynamic from "next/dynamic";
import { CopyButton } from "@/components/ui/copy-button";
import { CampaignTable } from "@/components/cockpit/campaigns/campaign-table";
import { ModuleCalloutsList } from "@/components/cockpit/module-callouts-list";
import { ChartSection } from "@/components/cockpit/ui/module-primitives";
import { ChartSkeleton } from "@/components/cockpit/ui/chart-skeleton";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import { buildModuleCallouts } from "@/lib/cockpit-callouts";

const SpendByChannelChart = dynamic(
  () => import("@/components/cockpit/metrics/spend-by-channel-chart").then((m) => m.SpendByChannelChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const RoasByChannelChart = dynamic(
  () => import("@/components/cockpit/metrics/roas-by-channel").then((m) => m.RoasByChannelChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const AcquisitionFunnelChart = dynamic(
  () => import("@/components/cockpit/metrics/acquisition-funnel").then((m) => m.AcquisitionFunnelChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export function AcquisitionModule({
  project,
  opportunity,
  data,
  onAddCampaign,
  onUpdateCampaign,
  onRemoveCampaign,
  onModuleChange,
}: CockpitModuleProps) {
  const campaigns = project.campaigns ?? [];
  const latest = data.metrics.latest;
  const channel = opportunity.acquisition[0];
  const emailTemplate = opportunity.emailTemplates?.[0];
  const callouts = buildModuleCallouts("acquisition", project, opportunity, {
    alerts: data.alerts,
  });

  return (
    <div className="space-y-6">
      <ModuleCalloutsList callouts={callouts} onModuleChange={onModuleChange} />

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <CampaignTable
          campaigns={campaigns}
          onAdd={onAddCampaign}
          onUpdate={onUpdateCampaign}
          onRemove={onRemoveCampaign}
        />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSection title="Dépenses par canal">
          <SpendByChannelChart campaigns={campaigns} />
        </ChartSection>
        <ChartSection title="ROAS par campagne">
          <RoasByChannelChart campaigns={campaigns} />
        </ChartSection>
      </div>
      {latest ? (
        <ChartSection title="Funnel d'acquisition">
          <AcquisitionFunnelChart snapshot={latest} />
        </ChartSection>
      ) : null}
      {channel ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="font-semibold">Canal recommandé — {channel.title}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {channel.tactics.map((tactic) => (
              <li key={tactic} className="flex gap-2">
                <span className="text-primary">·</span>
                {tactic}
              </li>
            ))}
          </ul>
          {emailTemplate ? (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{emailTemplate.name}</p>
                <CopyButton text={emailTemplate.body} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Objet : {emailTemplate.subject}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
