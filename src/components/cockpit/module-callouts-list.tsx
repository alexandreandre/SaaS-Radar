"use client";

import type { ModuleCalloutDef } from "@/lib/cockpit-callouts";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { ModuleCallout } from "@/components/cockpit/ui/module-callout";

export function ModuleCalloutsList({
  callouts,
  onModuleChange,
}: {
  callouts: ModuleCalloutDef[];
  onModuleChange: (module: CockpitModuleId) => void;
}) {
  if (callouts.length === 0) return null;

  return (
    <div className="space-y-2">
      {callouts.map((callout) => (
        <ModuleCallout
          key={callout.id}
          title={callout.title}
          description={callout.description}
          actionLabel={callout.actionLabel}
          icon={callout.icon}
          variant={callout.variant}
          onAction={() => onModuleChange(callout.actionModule)}
        />
      ))}
    </div>
  );
}
