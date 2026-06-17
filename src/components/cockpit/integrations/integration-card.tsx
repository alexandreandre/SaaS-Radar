"use client";

import { useEffect, useState } from "react";
import { Loader2, Plug, RefreshCw, Unplug } from "lucide-react";
import type { ConnectorDefinition } from "@/lib/connectors/types";
import type { ConnectorId, Integration } from "@/lib/connectors/types";
import { ConnectorLogo } from "@/components/cockpit/integrations/connector-logo";
import { StripeRakDialog } from "@/components/cockpit/integrations/stripe-connect-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";

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
  projectId: string;
  connector: ConnectorDefinition;
  integration?: Integration;
  onConnect: (id: ConnectorId, options?: ConnectIntegrationOptions) => Promise<void>;
  onSync: (id: ConnectorId) => Promise<void>;
  onDisconnect: (id: ConnectorId) => Promise<void>;
};

export function IntegrationCard({
  projectId,
  connector,
  integration,
  onConnect,
  onSync,
  onDisconnect,
}: IntegrationCardProps) {
  const [rakDialogOpen, setRakDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const isStripe = connector.id === "stripe";
  const isDemo = integration?.status === "demo";
  const isRealConnected = integration?.status === "connected";
  const isConnected = isStripe ? isRealConnected : isDemo || isRealConnected;

  useEffect(() => {
    if (!isStripe) return;
    void fetch("/api/connectors/stripe/config")
      .then((res) => res.json())
      .then((data: { oauthConfigured?: boolean }) => {
        setOauthConfigured(Boolean(data.oauthConfigured));
      })
      .catch(() => setOauthConfigured(false))
      .finally(() => setConfigLoaded(true));
  }, [isStripe]);

  function handleStripeOAuth() {
    window.location.href = `/api/connectors/stripe/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await onSync(connector.id);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await onDisconnect(connector.id);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <ConnectorLogo connectorId={connector.id} size="md" showRing={isConnected} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
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
              {!isStripe && isDemo ? (
                <Badge variant="outline" className="shrink-0 border-violet-500/40 text-violet-700">
                  Démo
                </Badge>
              ) : isConnected ? (
                <Badge variant="success" className="shrink-0">
                  Connecté
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{connector.description}</p>
        {connector.cockpitImpact ? (
          <p className="mt-2 text-xs text-primary/80">{connector.cockpitImpact}</p>
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
        {integration?.lastError ? (
          <p className="mt-2 text-xs text-destructive">{integration.lastError}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          {!isConnected ? (
            isStripe ? (
              <>
                <Button
                  size="sm"
                  className="w-fit"
                  onClick={handleStripeOAuth}
                  disabled={!oauthConfigured || !configLoaded}
                >
                  <Plug className="h-4 w-4" />
                  Connecter avec Stripe
                </Button>
                {!configLoaded ? (
                  <p className="text-xs text-muted-foreground">Vérification OAuth…</p>
                ) : !oauthConfigured ? (
                  <p className="text-xs text-muted-foreground">
                    Connexion en 1 clic indisponible sur cette instance.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Lecture seule · révocable depuis Stripe
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setRakDialogOpen(true)}
                  className="w-fit text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Utiliser une clé restreinte
                </button>
              </>
            ) : (
              <Button size="sm" className="w-fit" onClick={() => void onConnect(connector.id)}>
                <Plug className="h-4 w-4" />
                Connecter (démo)
              </Button>
            )
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleSync()}
                disabled={syncing || disconnecting}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Synchroniser
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn("text-muted-foreground")}
                onClick={() => void handleDisconnect()}
                disabled={syncing || disconnecting}
              >
                <Unplug className="h-4 w-4" />
                Déconnecter
              </Button>
            </div>
          )}
        </div>
      </div>

      {isStripe ? (
        <StripeRakDialog
          open={rakDialogOpen}
          onOpenChange={setRakDialogOpen}
          onConnect={(options) => onConnect("stripe", options)}
        />
      ) : null}
    </>
  );
}
