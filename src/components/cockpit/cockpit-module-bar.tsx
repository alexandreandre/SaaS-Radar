"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCockpitModule, type CockpitModuleId } from "@/lib/cockpit-modules";
import type { CockpitAlert } from "@/lib/cockpit-alerts";

type CockpitModuleBarProps = {
  activeModule: CockpitModuleId;
  alerts: CockpitAlert[];
  onOpenNav: () => void;
};

export function CockpitModuleBar({ activeModule, alerts, onOpenNav }: CockpitModuleBarProps) {
  const mod = getCockpitModule(activeModule);
  const Icon = mod.icon;
  const alertCount = alerts.filter((alert) => alert.actionModule === activeModule).length;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card px-3 py-2 shadow-sm lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="truncate text-sm font-medium">{mod.label}</span>
        {alertCount > 0 ? (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-medium text-amber-800">
            {alertCount}
          </span>
        ) : null}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onOpenNav} className="shrink-0">
        <Menu className="h-4 w-4" aria-hidden />
        Menu
      </Button>
    </div>
  );
}
