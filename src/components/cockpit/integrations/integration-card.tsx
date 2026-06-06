"use client";

import { Plug, RefreshCw, Unplug } from "lucide-react";
import type { ConnectorDefinition } from "@/lib/connectors/types";
import type { ConnectorId, Integration } from "@/lib/connectors/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<ConnectorDefinition["category"], string> = {
  payments: "Paiements",
  ads: "Publicité",
  analytics: "Analytics",
  email: "Email",
  support: "Support",
  finance: "Finance",
  accounting: "Compta",
  dev: "Dev",
  monitoring: "Monitoring",
  communication: "Communication",
  crm: "CRM",
};

type IntegrationCardProps = {
  connector: ConnectorDefinition;
  integration?: Integration;
  onConnect: (id: ConnectorId) => void;
  onSync: (id: ConnectorId) => void;
  onDisconnect: (id: ConnectorId) => void;
};

export function IntegrationCard({
  connector,
  integration,
  onConnect,
  onSync,
  onDisconnect,
}: IntegrationCardProps) {
  const isDemo = integration?.status === "demo";
  const isConnected = integration?.status === "demo" || integration?.status === "connected";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{connector.name}</p>
            {connector.priority === "p0" ? (
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                P0
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {CATEGORY_LABELS[connector.category]} · {connector.jobLabel}
          </p>
        </div>
        {isDemo ? (
          <Badge variant="outline" className="border-violet-500/40 text-violet-700">
            Démo
          </Badge>
        ) : isConnected ? (
          <Badge variant="success">Connecté</Badge>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{connector.description}</p>
      {connector.impactOnPromise ? (
        <p className="mt-2 text-xs text-primary/80">{connector.impactOnPromise}</p>
      ) : null}
      {connector.provides.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Fournit : {connector.provides.join(", ")}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Streams dédiés (finance, dev, CRM…)</p>
      )}
      {integration?.lastSyncAt ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Dernière sync : {new Date(integration.lastSyncAt).toLocaleDateString("fr-FR")}
          {integration.accountLabel ? ` · ${integration.accountLabel}` : ""}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {!isConnected ? (
          <Button size="sm" onClick={() => onConnect(connector.id)}>
            <Plug className="h-4 w-4" />
            Connecter (démo)
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => onSync(connector.id)}>
              <RefreshCw className="h-4 w-4" />
              Synchroniser
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn("text-muted-foreground")}
              onClick={() => onDisconnect(connector.id)}
            >
              <Unplug className="h-4 w-4" />
              Déconnecter
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
