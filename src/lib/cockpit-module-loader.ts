"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import type { UserProject } from "@/lib/portfolio";
import { shouldShowLaunchPad } from "@/lib/build-launch";
import { CockpitModuleSkeleton } from "@/components/cockpit/cockpit-module-skeleton";

function loadModule(id: CockpitModuleId) {
  switch (id) {
    case "overview":
      return import("@/components/cockpit/modules/overview-module").then((m) => m.OverviewModule);
    case "produit":
      return import("@/components/cockpit/modules/product-module").then((m) => m.ProductModule);
    case "revenus":
      return import("@/components/cockpit/modules/revenue-module").then((m) => m.RevenueModule);
    case "acquisition":
      return import("@/components/cockpit/modules/acquisition-module").then((m) => m.AcquisitionModule);
    case "finance":
      return import("@/components/cockpit/modules/finance-module").then((m) => m.FinanceModule);
    case "clients":
      return import("@/components/cockpit/modules/clients-module").then((m) => m.ClientsModule);
    case "rapports":
      return import("@/components/cockpit/modules/reports-module").then((m) => m.ReportsModule);
    case "playbook":
      return import("@/components/cockpit/modules/playbook-module").then((m) => m.PlaybookModule);
    case "build":
      return import("@/components/cockpit/modules/build-module").then((m) => m.BuildModule);
    case "integrations":
      return import("@/components/cockpit/modules/integrations-module").then((m) => m.IntegrationsModule);
  }
}

function dynamicModule(id: CockpitModuleId): ComponentType<CockpitModuleProps> {
  return dynamic(() => loadModule(id).then((Component) => ({ default: Component })), {
    loading: CockpitModuleSkeleton,
  });
}

export const COCKPIT_MODULE_MAP: Record<CockpitModuleId, ComponentType<CockpitModuleProps>> = {
  overview: dynamicModule("overview"),
  produit: dynamicModule("produit"),
  revenus: dynamicModule("revenus"),
  acquisition: dynamicModule("acquisition"),
  finance: dynamicModule("finance"),
  clients: dynamicModule("clients"),
  rapports: dynamicModule("rapports"),
  playbook: dynamicModule("playbook"),
  build: dynamicModule("build"),
  integrations: dynamicModule("integrations"),
};

export const LaunchPad = dynamic(
  () => import("@/components/cockpit/launch-pad/launch-pad").then((m) => ({ default: m.LaunchPad })),
  { loading: CockpitModuleSkeleton }
);

/** Précharge le shell et l'écran d'entrée probable avant navigation. */
export function prefetchCockpitEntry(project: UserProject, moduleId: CockpitModuleId = "build") {
  void import("@/components/cockpit/cockpit-shell");
  if (moduleId === "build" || !shouldShowLaunchPad(project)) {
    void loadModule(moduleId);
    return;
  }
  void import("@/components/cockpit/launch-pad/launch-pad");
}

export { CockpitModuleSkeleton };
