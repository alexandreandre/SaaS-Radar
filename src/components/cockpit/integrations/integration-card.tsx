"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Plug, RefreshCw, Unplug } from "lucide-react";
import type { ConnectorDefinition } from "@/lib/connectors/types";
import type { ConnectorId, Integration } from "@/lib/connectors/types";
import {
  getConnectorConnectionProfile,
  getIntegrationDisplayStatus,
  isIntegrationActive,
  type IntegrationDisplayStatus,
} from "@/lib/connectors/connection-profile";
import {
  integrationNeedsAction,
  isOAuthAdsConnector,
} from "@/lib/connectors/integration-health";
import { getMetricChips } from "@/lib/connectors/metric-labels";
import { ConnectorLogo } from "@/components/cockpit/integrations/connector-logo";
import { StripeRakDialog } from "@/components/cockpit/integrations/stripe-connect-dialog";
import { GoogleAdsConnectDialog } from "@/components/cockpit/integrations/google-ads-connect-dialog";
import { MetaAdsConnectDialog } from "@/components/cockpit/integrations/meta-ads-connect-dialog";
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
  onPatch?: (id: ConnectorId, patch: Partial<Integration>) => void;
};

const OAUTH_ADS_HEALTH_PATH: Partial<Record<ConnectorId, string>> = {
  "google-ads": "google-ads",
  "meta-ads": "meta-ads",
};

function IntegrationStatusBadge({ status }: { status: IntegrationDisplayStatus }) {
  if (status === "connected") {
    return (
      <Badge variant="success" className="shrink-0">
        Connecté
      </Badge>
    );
  }
  if (status === "demo") {
    return (
      <Badge variant="demo" className="shrink-0">
        Démo
      </Badge>
    );
  }
  return null;
}

function IntegrationMetricChips({ connector }: { connector: ConnectorDefinition }) {
  const chips =
    connector.provides.length > 0 ? getMetricChips(connector.provides) : ["Stream cockpit"];

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((label) => (
        <Badge key={label} variant="outline" className="text-[10px] font-normal normal-case">
          {label}
        </Badge>
      ))}
    </div>
  );
}

type IntegrationCardActionsProps = {
  connectorId: ConnectorId;
  profile: ReturnType<typeof getConnectorConnectionProfile>;
  isActive: boolean;
  needsAction: boolean;
  syncing: boolean;
  disconnecting: boolean;
  onOpenDialog: () => void;
  onConnect: (id: ConnectorId, options?: ConnectIntegrationOptions) => Promise<void>;
  onSync: () => Promise<void>;
  onDisconnect: () => Promise<void>;
};

function IntegrationCardActions({
  connectorId,
  profile,
  isActive,
  needsAction,
  syncing,
  disconnecting,
  onOpenDialog,
  onConnect,
  onSync,
  onDisconnect,
}: IntegrationCardActionsProps) {
  if (!isActive) {
    if (profile.supportsReal && profile.connectDialog) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="w-fit" onClick={onOpenDialog}>
            <Plug className="h-4 w-4" />
            Connecter
          </Button>
          {profile.supportsDemo ? (
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={() => void onConnect(connectorId, { mode: "demo" })}
            >
              Essayer en démo
            </Button>
          ) : null}
        </div>
      );
    }

    return (
      <Button size="sm" className="w-fit" onClick={() => void onConnect(connectorId)}>
        Essayer en démo
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {needsAction && profile.connectDialog ? (
        <Button size="sm" variant="outline" onClick={onOpenDialog} disabled={syncing || disconnecting}>
          Reconnecter
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        onClick={() => void onSync()}
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
        onClick={() => void onDisconnect()}
        disabled={syncing || disconnecting}
      >
        <Unplug className="h-4 w-4" />
        Déconnecter
      </Button>
    </div>
  );
}

export function IntegrationCard({
  projectId,
  connector,
  integration,
  onConnect,
  onSync,
  onDisconnect,
  onPatch = () => {},
}: IntegrationCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const profile = getConnectorConnectionProfile(connector.id);
  const displayStatus = getIntegrationDisplayStatus(integration);
  const isActive = isIntegrationActive(displayStatus);
  const needsAction = integrationNeedsAction(integration);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (profile.connectDialog === "google-ads" && searchParams.get("google_ads_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "meta-ads" && searchParams.get("meta_ads_oauth") === "1") {
      setDialogOpen(true);
    }
  }, [profile.connectDialog, searchParams]);

  useEffect(() => {
    if (integration?.status !== "connected") return;
    if (integration.tokenExpiresAt) return;
    if (!isOAuthAdsConnector(connector.id)) return;

    const healthPath = OAUTH_ADS_HEALTH_PATH[connector.id];
    if (!healthPath) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          `/api/connectors/${healthPath}/health?projectId=${encodeURIComponent(projectId)}`,
        );
        const data = (await res.json()) as { tokenExpiresAt?: string; error?: string };
        if (!res.ok || !data.tokenExpiresAt || cancelled) return;
        onPatch(connector.id, { tokenExpiresAt: data.tokenExpiresAt });
      } catch {
        // Prefetch best-effort — sync manuelle reste disponible
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    connector.id,
    integration?.status,
    integration?.tokenExpiresAt,
    onPatch,
    projectId,
  ]);

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

  const connectDialogId = profile.connectDialog;

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <ConnectorLogo
            connectorId={connector.id}
            size="md"
            showRing={displayStatus === "connected"}
          />
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
              <IntegrationStatusBadge status={displayStatus} />
              {needsAction ? (
                <Badge
                  variant="outline"
                  className="shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                >
                  Action requise
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{connector.description}</p>

        <IntegrationMetricChips connector={connector} />

        {connector.cockpitImpact ? (
          <p className="mt-2 text-xs text-primary/80">{connector.cockpitImpact}</p>
        ) : null}

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
          <IntegrationCardActions
            connectorId={connector.id}
            profile={profile}
            isActive={isActive}
            needsAction={needsAction}
            syncing={syncing}
            disconnecting={disconnecting}
            onOpenDialog={() => setDialogOpen(true)}
            onConnect={onConnect}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
          />
        </div>
      </div>

      {connectDialogId === "stripe" ? (
        <StripeRakDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("stripe", options)}
        />
      ) : null}
      {connectDialogId === "google-ads" ? (
        <GoogleAdsConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("google-ads", options)}
        />
      ) : null}
      {connectDialogId === "meta-ads" ? (
        <MetaAdsConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("meta-ads", options)}
        />
      ) : null}
    </>
  );
}
