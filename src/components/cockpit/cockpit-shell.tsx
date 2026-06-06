"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import {
  DEFAULT_COCKPIT_MODULE,
  normalizeModuleId,
  type CockpitModuleId,
} from "@/lib/cockpit-modules";
import { DemoModeBanner } from "@/components/cockpit/demo-mode-banner";
import { CockpitPulseBar } from "@/components/cockpit/cockpit-pulse-bar";
import { CockpitSidebar } from "@/components/cockpit/cockpit-sidebar";
import { CockpitActionsPanel } from "@/components/cockpit/cockpit-actions-panel";
import { OverviewModule } from "@/components/cockpit/modules/overview-module";
import { RevenueModule } from "@/components/cockpit/modules/revenue-module";
import { AcquisitionModule } from "@/components/cockpit/modules/acquisition-module";
import { ProductModule } from "@/components/cockpit/modules/product-module";
import { FinanceModule } from "@/components/cockpit/modules/finance-module";
import { ClientsModule } from "@/components/cockpit/modules/clients-module";
import { BuildModule } from "@/components/cockpit/modules/build-module";
import { IntegrationsModule } from "@/components/cockpit/modules/integrations-module";
import { ReportsModule } from "@/components/cockpit/modules/reports-module";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import type { AdCampaign, ConnectorId, Expense, MetricsSnapshot } from "@/lib/connectors/types";

type CockpitShellProps = {
  project: UserProject;
  opportunity: Opportunity;
  data: import("@/hooks/use-cockpit-data").CockpitData;
  onRecordMrr: (amount: number, note?: string) => void;
  onToggleMilestone: (milestoneId: string) => void;
  onAddCampaign: (campaign: Omit<AdCampaign, "id">) => void;
  onUpdateCampaign: (id: string, patch: Partial<AdCampaign>) => void;
  onRemoveCampaign: (id: string) => void;
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onRemoveExpense: (id: string) => void;
  onConnectIntegration: (connectorId: ConnectorId) => void;
  onSyncIntegration: (connectorId: ConnectorId) => void;
  onDisconnectIntegration: (connectorId: ConnectorId) => void;
  onLogMetrics: (partial: Partial<MetricsSnapshot>) => void;
  onSetCashOnHand: (amount: number) => void;
};

const MODULE_MAP: Record<CockpitModuleId, React.ComponentType<CockpitModuleProps>> = {
  overview: OverviewModule,
  revenus: RevenueModule,
  acquisition: AcquisitionModule,
  produit: ProductModule,
  finance: FinanceModule,
  clients: ClientsModule,
  build: BuildModule,
  integrations: IntegrationsModule,
  rapports: ReportsModule,
};

export function CockpitShell({
  project,
  opportunity,
  data,
  onRecordMrr,
  onToggleMilestone,
  onAddCampaign,
  onUpdateCampaign,
  onRemoveCampaign,
  onAddExpense,
  onRemoveExpense,
  onConnectIntegration,
  onSyncIntegration,
  onDisconnectIntegration,
  onLogMetrics,
  onSetCashOnHand,
}: CockpitShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramModule = searchParams.get("module");
  const initialModule = paramModule
    ? normalizeModuleId(paramModule)
    : DEFAULT_COCKPIT_MODULE;

  const [activeModule, setActiveModule] = useState<CockpitModuleId>(initialModule);

  const handleModuleChange = useCallback(
    (module: CockpitModuleId) => {
      setActiveModule(module);
      const params = new URLSearchParams(searchParams.toString());
      params.set("module", module);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (paramModule) {
      setActiveModule(normalizeModuleId(paramModule));
    }
  }, [paramModule]);

  const ModuleComponent = MODULE_MAP[activeModule];

  const moduleProps: CockpitModuleProps = {
    project,
    opportunity,
    data,
    onToggleMilestone,
    onAddCampaign,
    onUpdateCampaign,
    onRemoveCampaign,
    onAddExpense,
    onRemoveExpense,
    onConnectIntegration,
    onSyncIntegration,
    onDisconnectIntegration,
    onLogMetrics,
    onSetCashOnHand,
    onModuleChange: handleModuleChange,
  };

  return (
    <div className="mt-6 space-y-4">
      {data.metrics.hasDemoData ? <DemoModeBanner /> : null}
      <CockpitPulseBar data={data} hasDemoData={data.metrics.hasDemoData} />

      <div className="grid gap-6 xl:grid-cols-[220px_1fr_280px]">
        <div className="hidden xl:block">
          <CockpitSidebar
            activeModule={activeModule}
            onModuleChange={handleModuleChange}
            alerts={data.alerts}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <div className="overflow-x-auto pb-1 xl:hidden">
            <CockpitSidebar
              activeModule={activeModule}
              onModuleChange={handleModuleChange}
              alerts={data.alerts}
            />
          </div>
          <ModuleComponent {...moduleProps} />
        </div>

        <CockpitActionsPanel
          project={project}
          opportunity={opportunity}
          data={data}
          onRecordMrr={onRecordMrr}
          onLogMetrics={onLogMetrics}
          onModuleChange={handleModuleChange}
        />
      </div>
    </div>
  );
}
