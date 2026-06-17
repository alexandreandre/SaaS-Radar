"use client";

import { CONNECTORS } from "@/lib/connectors/registry";
import type { ConnectorId, Integration } from "@/lib/connectors/types";
import { IntegrationCard } from "@/components/cockpit/integrations/integration-card";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";

type IntegrationsGridProps = {
  projectId: string;
  integrations: Integration[];
  onConnect: (id: ConnectorId, options?: ConnectIntegrationOptions) => Promise<void>;
  onSync: (id: ConnectorId) => Promise<void>;
  onDisconnect: (id: ConnectorId) => Promise<void>;
};

export function IntegrationsGrid({
  projectId,
  integrations,
  onConnect,
  onSync,
  onDisconnect,
}: IntegrationsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CONNECTORS.map((connector) => {
        const integration = integrations.find((i) => i.connectorId === connector.id);
        return (
          <IntegrationCard
            key={connector.id}
            projectId={projectId}
            connector={connector}
            integration={integration}
            onConnect={onConnect}
            onSync={onSync}
            onDisconnect={onDisconnect}
          />
        );
      })}
    </div>
  );
}
