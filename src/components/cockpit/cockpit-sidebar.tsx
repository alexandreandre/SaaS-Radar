"use client";

import { cn } from "@/lib/utils";
import {
  COCKPIT_MODULES,
  type CockpitModuleId,
} from "@/lib/cockpit-modules";
import type { CockpitAlert } from "@/lib/cockpit-alerts";

type CockpitSidebarProps = {
  activeModule: CockpitModuleId;
  onModuleChange: (module: CockpitModuleId) => void;
  alerts: CockpitAlert[];
};

export function CockpitSidebar({
  activeModule,
  onModuleChange,
  alerts,
}: CockpitSidebarProps) {
  const alertCountByModule = alerts.reduce<Record<string, number>>((acc, alert) => {
    acc[alert.actionModule] = (acc[alert.actionModule] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <nav className="space-y-1">
      {COCKPIT_MODULES.map((mod) => {
        const Icon = mod.icon;
        const count = alertCountByModule[mod.id] ?? 0;
        const active = activeModule === mod.id;

        return (
          <button
            key={mod.id}
            type="button"
            onClick={() => onModuleChange(mod.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{mod.label}</span>
            {count > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-medium text-amber-800">
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
