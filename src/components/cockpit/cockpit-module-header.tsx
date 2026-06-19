"use client";

import { getResolvedCockpitModule, type CockpitModuleId } from "@/lib/cockpit-modules";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";

type CockpitModuleHeaderProps = {
  activeModule: CockpitModuleId;
  opportunity: Opportunity;
  project?: UserProject;
};

export function CockpitModuleHeader({ activeModule, opportunity, project }: CockpitModuleHeaderProps) {
  const mod = getResolvedCockpitModule(activeModule, opportunity, project);

  return (
    <h1 className="hidden font-data text-base font-semibold uppercase tracking-data text-foreground lg:block">
      {mod.label}
    </h1>
  );
}
