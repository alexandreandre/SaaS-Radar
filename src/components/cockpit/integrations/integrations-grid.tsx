"use client";

import { CONNECTORS } from "@/lib/connectors/registry";
import type { ConnectorId, Integration } from "@/lib/connectors/types";
import { IntegrationCard } from "@/components/cockpit/integrations/integration-card";

type IntegrationsGridProps = {
  integrations: Integration[];
  onConnect: (id: ConnectorId) => void;
  onSync: (id: ConnectorId) => void;
  onDisconnect: (id: ConnectorId) => void;
};

export function IntegrationsGrid({
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
