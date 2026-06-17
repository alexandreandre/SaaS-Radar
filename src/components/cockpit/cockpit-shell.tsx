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
import { cn } from "@/lib/utils";
import { DemoModeBanner } from "@/components/cockpit/demo-mode-banner";
import { CockpitSidebar } from "@/components/cockpit/cockpit-sidebar";
import { CockpitModuleBar } from "@/components/cockpit/cockpit-module-bar";
import { CockpitModuleHeader } from "@/components/cockpit/cockpit-module-header";
import { CockpitNavDrawer } from "@/components/cockpit/cockpit-nav-drawer";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import type { AdCampaign, ConnectorId, Expense, MetricsSnapshot } from "@/lib/connectors/types";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";
import { shouldShowLaunchPad } from "@/lib/build-launch";
import { COCKPIT_MODULE_MAP, LaunchPad } from "@/lib/cockpit-module-loader";
import { useCockpitSidebarCollapsed } from "@/hooks/use-cockpit-sidebar-collapsed";

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
  onConnectIntegration: (
    connectorId: ConnectorId,
    options?: ConnectIntegrationOptions,
  ) => Promise<void>;
  onSyncIntegration: (connectorId: ConnectorId) => Promise<void>;
  onDisconnectIntegration: (connectorId: ConnectorId) => Promise<void>;
  onLogMetrics: (partial: Partial<MetricsSnapshot>) => void;
  onSetCashOnHand: (amount: number) => void;
  onCompleteOnboarding: () => void;
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
  onCompleteOnboarding,
}: CockpitShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramModule = searchParams.get("module");
  const launchPadMode = shouldShowLaunchPad(project) && !paramModule;
  const { collapsed, setCollapsed, hydrated } = useCockpitSidebarCollapsed();
  const initialModule = paramModule
    ? normalizeModuleId(paramModule)
    : DEFAULT_COCKPIT_MODULE;

  const [activeModule, setActiveModule] = useState<CockpitModuleId>(initialModule);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

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

  useEffect(() => {
    if (paramModule === "build" && project.onboardingCompleted !== true) {
      onCompleteOnboarding();
    }
  }, [paramModule, project.onboardingCompleted, onCompleteOnboarding]);

  useEffect(() => {
    if (project.onboardingCompleted && launchPadMode === false) {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.get("module")) {
        params.set("module", "overview");
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [project.onboardingCompleted, launchPadMode, router, searchParams]);

  const ModuleComponent = COCKPIT_MODULE_MAP[activeModule];

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
    onRecordMrr,
    onSetCashOnHand,
    onModuleChange: handleModuleChange,
  };

  if (launchPadMode) {
    return (
      <LaunchPad
        project={project}
        opportunity={opportunity}
        onToggleMilestone={onToggleMilestone}
        onRecordMrr={onRecordMrr}
        onCompleteOnboarding={onCompleteOnboarding}
        onOpenBuild={() => {
          onCompleteOnboarding();
          handleModuleChange("build");
        }}
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      <aside
        className={cn(
          "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/10 transition-[width] duration-200 lg:flex",
          hydrated && collapsed ? "w-14" : "w-60"
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <CockpitSidebar
            activeModule={activeModule}
            onModuleChange={handleModuleChange}
            alerts={data.alerts}
            opportunity={opportunity}
            project={project}
            collapsed={hydrated && collapsed}
            onCollapsedChange={setCollapsed}
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-4 py-10 sm:px-6">
        <div className="space-y-4">
          <CockpitModuleHeader activeModule={activeModule} opportunity={opportunity} />

          {data.metrics.hasDemoData ? <DemoModeBanner /> : null}

          <CockpitModuleBar
            activeModule={activeModule}
            alerts={data.alerts}
            opportunity={opportunity}
            onOpenNav={() => setNavDrawerOpen(true)}
          />

          <ModuleComponent {...moduleProps} />
        </div>
      </div>

      <CockpitNavDrawer
        open={navDrawerOpen}
        onOpenChange={setNavDrawerOpen}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        alerts={data.alerts}
        opportunity={opportunity}
        project={project}
      />
    </div>
  );
}
