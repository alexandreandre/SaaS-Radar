"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Plug, Unplug } from "lucide-react";
import type { ConnectorDefinition } from "@/lib/connectors/types";
import type { ConnectorId, Integration } from "@/lib/connectors/types";
import type { ConnectorStreamPayload } from "@/lib/connectors/streams";
import type { GitHubTrackedRepo } from "@/lib/portfolio";
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
import { TikTokAdsConnectDialog } from "@/components/cockpit/integrations/tiktok-ads-connect-dialog";
import { LinkedInAdsConnectDialog } from "@/components/cockpit/integrations/linkedin-ads-connect-dialog";
import { MicrosoftAdsConnectDialog } from "@/components/cockpit/integrations/microsoft-ads-connect-dialog";
import { PlausibleConnectDialog } from "@/components/cockpit/integrations/plausible-connect-dialog";
import { FathomConnectDialog } from "@/components/cockpit/integrations/fathom-connect-dialog";
import { PostHogConnectDialog } from "@/components/cockpit/integrations/posthog-connect-dialog";
import { MixpanelConnectDialog } from "@/components/cockpit/integrations/mixpanel-connect-dialog";
import { GoogleAnalyticsConnectDialog } from "@/components/cockpit/integrations/google-analytics-connect-dialog";
import { GitHubConnectDialog } from "@/components/cockpit/integrations/github-connect-dialog";
import { LoopsConnectDialog } from "@/components/cockpit/integrations/loops-connect-dialog";
import { BrevoConnectDialog } from "@/components/cockpit/integrations/brevo-connect-dialog";
import { ResendConnectDialog } from "@/components/cockpit/integrations/resend-connect-dialog";
import { LemonSqueezyConnectDialog } from "@/components/cockpit/integrations/lemon-squeezy-connect-dialog";
import { PaddleConnectDialog } from "@/components/cockpit/integrations/paddle-connect-dialog";
import { FreemiusConnectDialog } from "@/components/cockpit/integrations/freemius-connect-dialog";
import { CrispConnectDialog } from "@/components/cockpit/integrations/crisp-connect-dialog";
import { IntercomConnectDialog } from "@/components/cockpit/integrations/intercom-connect-dialog";
import { ZendeskConnectDialog } from "@/components/cockpit/integrations/zendesk-connect-dialog";
import { PipedriveConnectDialog } from "@/components/cockpit/integrations/pipedrive-connect-dialog";
import { QontoConnectDialog } from "@/components/cockpit/integrations/qonto-connect-dialog";
import { PennylaneConnectDialog } from "@/components/cockpit/integrations/pennylane-connect-dialog";
import { AbbyConnectDialog } from "@/components/cockpit/integrations/abby-connect-dialog";
import { BetterStackConnectDialog } from "@/components/cockpit/integrations/better-stack-connect-dialog";
import { SlackConnectDialog } from "@/components/cockpit/integrations/slack-connect-dialog";
import { VercelConnectDialog } from "@/components/cockpit/integrations/vercel-connect-dialog";
import { SentryConnectDialog } from "@/components/cockpit/integrations/sentry-connect-dialog";
import { HubSpotConnectDialog } from "@/components/cockpit/integrations/hubspot-connect-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";
import { usePortfolioConnectors } from "@/contexts/portfolio/use-portfolio";

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
  githubTrackedRepos?: GitHubTrackedRepo[];
  githubStream?: ConnectorStreamPayload;
  onConnect: (id: ConnectorId, options?: ConnectIntegrationOptions) => Promise<void>;
  onSync: (id: ConnectorId) => Promise<void>;
  onDisconnect: (id: ConnectorId) => Promise<void>;
  onPatch?: (id: ConnectorId, patch: Partial<Integration>) => void;
};

const OAUTH_ADS_HEALTH_PATH: Partial<Record<ConnectorId, string>> = {
  "google-ads": "google-ads",
  "meta-ads": "meta-ads",
  "tiktok-ads": "tiktok-ads",
  "linkedin-ads": "linkedin-ads",
  "microsoft-ads": "microsoft-ads",
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
  onDisconnect,
}: IntegrationCardActionsProps) {
  if (!isActive) {
    if (profile.supportsReal) {
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
      <Button size="sm" className="w-fit" onClick={() => void onConnect(connectorId, { mode: "demo" })}>
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
  githubTrackedRepos = [],
  githubStream,
  onConnect,
  onSync,
  onDisconnect,
  onPatch = () => {},
}: IntegrationCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [oauthSyncing, setOauthSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const { autoSyncingProjectId, autoSyncingConnectors } = usePortfolioConnectors(projectId);

  const autoSyncing =
    autoSyncingProjectId === projectId && autoSyncingConnectors.includes(connector.id);
  const syncing = oauthSyncing || autoSyncing;

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
    if (profile.connectDialog === "tiktok-ads" && searchParams.get("tiktok_ads_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "linkedin-ads" && searchParams.get("linkedin_ads_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "microsoft-ads" && searchParams.get("microsoft_ads_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "intercom" && searchParams.get("intercom_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "zendesk" && searchParams.get("zendesk_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "qonto" && searchParams.get("qonto_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "pennylane" && searchParams.get("pennylane_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "slack" && searchParams.get("slack_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "hubspot" && searchParams.get("hubspot_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "pipedrive" && searchParams.get("pipedrive_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "google-analytics" && searchParams.get("google_analytics_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "sentry" && searchParams.get("sentry_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "github" && searchParams.get("github_oauth") === "1") {
      setDialogOpen(true);
    }
    if (profile.connectDialog === "vercel") {
      const vercelOauth = searchParams.get("vercel_oauth");
      if (vercelOauth === "connected") {
        void (async () => {
          setOauthSyncing(true);
          try {
            await onSync(connector.id);
          } finally {
            setOauthSyncing(false);
          }
        })();
        const params = new URLSearchParams(window.location.search);
        params.delete("vercel_oauth");
        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
      } else if (vercelOauth === "1") {
        setDialogOpen(true);
      }
    }
  }, [connector.id, onSync, profile.connectDialog, searchParams]);

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
    <div className="h-full">
      <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-card">
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

        {integration?.lastSyncAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Dernière sync : {new Date(integration.lastSyncAt).toLocaleDateString("fr-FR")}
            {integration.accountLabel ? ` · ${integration.accountLabel}` : ""}
          </p>
        ) : null}
        {syncing ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Synchronisation…
          </p>
        ) : null}
        {integration?.lastError ? (
          <p className="mt-2 text-xs text-destructive">{integration.lastError}</p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <IntegrationCardActions
            connectorId={connector.id}
            profile={profile}
            isActive={isActive}
            needsAction={needsAction}
            syncing={syncing}
            disconnecting={disconnecting}
            onOpenDialog={() => setDialogOpen(true)}
            onConnect={onConnect}
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
      {connectDialogId === "tiktok-ads" ? (
        <TikTokAdsConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("tiktok-ads", options)}
        />
      ) : null}
      {connectDialogId === "linkedin-ads" ? (
        <LinkedInAdsConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("linkedin-ads", options)}
        />
      ) : null}
      {connectDialogId === "microsoft-ads" ? (
        <MicrosoftAdsConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("microsoft-ads", options)}
        />
      ) : null}
      {connectDialogId === "plausible" ? (
        <PlausibleConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("plausible", options)}
        />
      ) : null}
      {connectDialogId === "fathom" ? (
        <FathomConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("fathom", options)}
        />
      ) : null}
      {connectDialogId === "posthog" ? (
        <PostHogConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("posthog", options)}
        />
      ) : null}
      {connectDialogId === "mixpanel" ? (
        <MixpanelConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("mixpanel", options)}
        />
      ) : null}
      {connectDialogId === "google-analytics" ? (
        <GoogleAnalyticsConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("google-analytics", options)}
        />
      ) : null}
      {connectDialogId === "github" ? (
        <GitHubConnectDialog
          projectId={projectId}
          trackedRepos={githubTrackedRepos}
          stream={githubStream}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("github", options)}
        />
      ) : null}
      {connectDialogId === "loops" ? (
        <LoopsConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("loops", options)}
        />
      ) : null}
      {connectDialogId === "brevo" ? (
        <BrevoConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("brevo", options)}
        />
      ) : null}
      {connectDialogId === "resend" ? (
        <ResendConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("resend", options)}
        />
      ) : null}
      {connectDialogId === "lemon-squeezy" ? (
        <LemonSqueezyConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("lemon-squeezy", options)}
        />
      ) : null}
      {connectDialogId === "paddle" ? (
        <PaddleConnectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("paddle", options)}
        />
      ) : null}
      {connectDialogId === "freemius" ? (
        <FreemiusConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("freemius", options)}
        />
      ) : null}
      {connectDialogId === "crisp" ? (
        <CrispConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("crisp", options)}
        />
      ) : null}
      {connectDialogId === "intercom" ? (
        <IntercomConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("intercom", options)}
        />
      ) : null}
      {connectDialogId === "zendesk" ? (
        <ZendeskConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("zendesk", options)}
        />
      ) : null}
      {connectDialogId === "pipedrive" ? (
        <PipedriveConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("pipedrive", options)}
        />
      ) : null}
      {connectDialogId === "qonto" ? (
        <QontoConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("qonto", options)}
        />
      ) : null}
      {connectDialogId === "pennylane" ? (
        <PennylaneConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("pennylane", options)}
        />
      ) : null}
      {connectDialogId === "abby" ? (
        <AbbyConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("abby", options)}
        />
      ) : null}
      {connectDialogId === "better-stack" ? (
        <BetterStackConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("better-stack", options)}
        />
      ) : null}
      {connectDialogId === "slack" ? (
        <SlackConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("slack", options)}
        />
      ) : null}
      {connectDialogId === "hubspot" ? (
        <HubSpotConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("hubspot", options)}
        />
      ) : null}
      {connectDialogId === "vercel" ? (
        <VercelConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("vercel", options)}
          onSyncConnected={() => onSync("vercel")}
        />
      ) : null}
      {connectDialogId === "sentry" ? (
        <SentryConnectDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConnect={(options) => onConnect("sentry", options)}
        />
      ) : null}
    </div>
  );
}
