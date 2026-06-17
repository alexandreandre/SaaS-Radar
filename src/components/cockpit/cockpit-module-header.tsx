"use client";

import { getResolvedCockpitModule, type CockpitModuleId } from "@/lib/cockpit-modules";
import type { Opportunity } from "@/types/opportunity";

type CockpitModuleHeaderProps = {
  activeModule: CockpitModuleId;
  opportunity: Opportunity;
};

export function CockpitModuleHeader({ activeModule, opportunity }: CockpitModuleHeaderProps) {
  const mod = getResolvedCockpitModule(activeModule, opportunity);

  return (
    <h1 className="hidden font-data text-base font-semibold uppercase tracking-data text-foreground lg:block">
      {mod.label}
    </h1>
  );
}
