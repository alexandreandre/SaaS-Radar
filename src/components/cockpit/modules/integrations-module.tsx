"use client";

import { IntegrationsMarketplace } from "@/components/cockpit/integrations/integrations-marketplace";
import { StackHealthBar } from "@/components/cockpit/stack-health-bar";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function IntegrationsModule({
  project,
  data,
  onConnectIntegration,
  onSyncIntegration,
  onDisconnectIntegration,
  onModuleChange,
}: CockpitModuleProps) {
  const integrations = project.integrations ?? [];

  return (
    <div className="space-y-6">
      <StackHealthBar stackHealth={data.stackHealth} onModuleChange={onModuleChange} compact />
      <IntegrationsMarketplace
        integrations={integrations}
        onConnect={onConnectIntegration}
        onSync={onSyncIntegration}
        onDisconnect={onDisconnectIntegration}
      />
    </div>
  );
}
