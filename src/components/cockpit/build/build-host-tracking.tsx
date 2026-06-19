"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Unplug } from "lucide-react";
import { BuildPlatformLogo, BuildToolLogo } from "@/components/cockpit/build/build-tool-logo";
import { BuildCopyPrompt } from "@/components/cockpit/build/build-copy-prompt";
import { VercelConnectDialog } from "@/components/cockpit/integrations/vercel-connect-dialog";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { UserProject } from "@/lib/portfolio";
import { resolveProductName } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import type { BuildTool } from "@/lib/build/tools";
import type { BuildTrackingProfile } from "@/lib/build/tracking-profile";
import { getUnifiedDeployStatus } from "@/lib/build/deploy-status";
import { getVercelCursorPrompt, getVercelManualSteps } from "@/lib/build/deploy-prompts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/contexts/portfolio-context";
import {
  detectProductLogoFromHost,
  mergeDetectedProductLogo,
} from "@/lib/build/product-logo-client";
import { useSearchParams } from "next/navigation";

type BuildHostTrackingProps = {
  project: UserProject;
  tool?: BuildTool;
  profile?: BuildTrackingProfile;
  opportunity?: Opportunity;
  onModuleChange?: (module: CockpitModuleId) => void;
  embedded?: boolean;
};

export function BuildHostTracking({
  project,
  tool,
  profile,
  opportunity,
  onModuleChange,
  embedded = false,
}: BuildHostTrackingProps) {
  const hostMode = profile?.host ?? "vercel";
  const { connectIntegration, syncIntegration, disconnectIntegration, setHostConnection, setProductLogo } =
    usePortfolio();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState(project.hostConnection?.productionUrl ?? "");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deployStatus = getUnifiedDeployStatus(project);
  const vercelStream = project.connectorStreams?.vercel;
  const isVercelConnected = Boolean(
    project.hostConnection?.provider === "vercel" && project.hostConnection?.projectId,
  );

  const handleSaveUrl = useCallback(
    async (provider: "vercel" | "custom") => {
      const trimmed = url.trim();
      if (!trimmed) return;
      const connection = {
        provider,
        productionUrl: trimmed,
        connectedAt: new Date().toISOString(),
      };
      setHostConnection(project.id, connection);
      const detected = await detectProductLogoFromHost(trimmed);
      const withLogo = mergeDetectedProductLogo({ ...project, hostConnection: connection }, detected);
      if (withLogo?.productLogo) {
        setProductLogo(project.id, withLogo.productLogo);
      }
    },
    [url, project, setHostConnection, setProductLogo],
  );

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      await syncIntegration(project.id, "vercel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSyncing(false);
    }
  }

  const hydrateAfterOAuth = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      await syncIntegration(project.id, "vercel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSyncing(false);
    }
    const params = new URLSearchParams(window.location.search);
    params.delete("vercel_oauth");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [project.id, syncIntegration]);

  async function handleDisconnect() {
    setSyncing(true);
    setError(null);
    try {
      await disconnectIntegration(project.id, "vercel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    setUrl(project.hostConnection?.productionUrl ?? "");
  }, [project.hostConnection?.productionUrl]);

  useEffect(() => {
    if (hostMode !== "vercel") return;

    const oauthStatus = searchParams.get("vercel_oauth");
    if (oauthStatus === "connected") {
      void hydrateAfterOAuth();
      return;
    }

    if (oauthStatus === "1") {
      setDialogOpen(true);
    }
  }, [hostMode, hydrateAfterOAuth, searchParams]);

  const hostTitle = profile?.hostTitle ?? "Hébergement & déploiement";
  const urlPlaceholder = profile?.urlPlaceholder ?? "https://votre-app.vercel.app";
  const hostHint =
    profile?.hostHint ??
    "Connectez Vercel ou collez simplement l'URL de production une fois en ligne.";

  const urlOnlyBody = (
    <div className="space-y-4">
      {project.hostConnection?.productionUrl ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
          <p className="font-medium text-emerald-600">App en ligne</p>
          <a
            href={project.hostConnection.productionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
          >
            {project.hostConnection.productionUrl}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{hostHint}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={urlPlaceholder}
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="button" size="sm" onClick={() => handleSaveUrl("custom")}>
          Enregistrer URL
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );

  const vercelBody = (
    <div className="space-y-4">
      {!project.hostConnection?.productionUrl && opportunity ? (
        <details className="rounded-lg border border-dashed border-primary/30 bg-primary/5">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            Pas encore sur Vercel ? Import manuel ou aide Cursor
          </summary>
          <div className="space-y-3 border-t border-primary/20 p-3">
            <ol className="space-y-1 text-xs leading-relaxed text-muted-foreground">
              {getVercelManualSteps(resolveProductName(project, opportunity!)).map((line, i) => (
                <li key={i}>
                  <span className="font-medium text-primary">{i + 1}. </span>
                  {line}
                </li>
              ))}
            </ol>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
              <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">
                <BuildPlatformLogo platform="vercel" size="sm" variant="inline" />
                vercel.com/new
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <BuildCopyPrompt
              label="Si vous bloquez — prompt Cursor"
              text={getVercelCursorPrompt(resolveProductName(project, opportunity!))}
              compact
            />
          </div>
        </details>
      ) : null}

      {isVercelConnected && project.hostConnection?.projectName ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
          <p className="font-medium text-emerald-600">
            Projet Vercel : {project.hostConnection.projectName}
          </p>
          {project.hostConnection.productionUrl ? (
            <a
              href={project.hostConnection.productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
            >
              {project.hostConnection.productionUrl}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      ) : null}

      {deployStatus ? (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            deployStatus.status === "success" && "border-emerald-500/30 bg-emerald-500/5",
            deployStatus.status === "failure" && "border-destructive/40 bg-destructive/5",
            deployStatus.status === "pending" && "border-amber-500/30 bg-amber-500/5",
            deployStatus.status === "unknown" && "border-border bg-muted/30",
          )}
        >
          <p className="font-medium">{deployStatus.label}</p>
          {deployStatus.detail ? (
            <p className="mt-0.5 text-muted-foreground">{deployStatus.detail}</p>
          ) : null}
          {deployStatus.url ? (
            <a
              href={deployStatus.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
            >
              {deployStatus.url}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{hostHint}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={urlPlaceholder}
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="button" size="sm" onClick={() => handleSaveUrl("vercel")}>
          Enregistrer URL
        </Button>
      </div>

      {vercelStream?.type === "dev" ? (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Taux deploys OK (30j)</p>
            <p className="font-semibold">{vercelStream.uptimePct} %</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Deploys 30j</p>
            <p className="font-semibold">{vercelStream.deploysLast30d}</p>
          </div>
          {vercelStream.infraCostMonthly ? (
            <div className="rounded-lg border border-border p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Coût infra ce mois</p>
              <p className="font-semibold">{vercelStream.infraCostMonthly.toFixed(2)}</p>
            </div>
          ) : isVercelConnected ? (
            <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground sm:col-span-2">
              Coûts infra : disponible sur plan Vercel Pro
            </div>
          ) : null}
        </div>
      ) : null}

      {onModuleChange ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onModuleChange("integrations")}
        >
          Marketplace connecteurs
        </Button>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );

  const body = hostMode === "url-only" ? urlOnlyBody : vercelBody;

  const titleIcon =
    hostMode === "url-only" && tool ? (
      <BuildToolLogo toolId={tool.id} size="sm" />
    ) : (
      <BuildPlatformLogo platform="vercel" size="sm" />
    );

  const headerActions =
    hostMode === "vercel" ? (
      !isVercelConnected ? (
        <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
          Connecter Vercel
        </Button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={syncing}
            onClick={() => void handleSync()}
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Synchroniser"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            disabled={syncing}
            onClick={() => void handleDisconnect()}
          >
            <Unplug className="h-4 w-4" />
            Déconnecter
          </Button>
        </div>
      )
    ) : null;

  const vercelDialog =
    hostMode === "vercel" ? (
      <VercelConnectDialog
        projectId={project.id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        returnTo="build"
        onConnect={(options) => connectIntegration(project.id, "vercel", options)}
        onSyncConnected={() => syncIntegration(project.id, "vercel")}
      />
    ) : null;

  if (embedded) {
    return (
      <div className="rounded-lg border border-border bg-muted/10 p-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              {titleIcon}
              {hostTitle}
            </h3>
          </div>
          {headerActions}
        </div>
        {body}
        {vercelDialog}
      </div>
    );
  }

  return (
    <details className="rounded-xl border border-border bg-card shadow-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        {hostMode === "url-only" && tool ? (
          <BuildToolLogo toolId={tool.id} size="sm" variant="inline" />
        ) : (
          <BuildPlatformLogo platform="vercel" size="sm" variant="inline" />
        )}
        <span className="font-medium">{hostTitle}</span>
        {deployStatus && hostMode === "vercel" ? (
          <span
            className={cn(
              "ml-auto text-xs font-medium",
              deployStatus.status === "success" && "text-emerald-600",
              deployStatus.status === "failure" && "text-destructive",
              deployStatus.status === "pending" && "text-amber-600",
            )}
          >
            {deployStatus.label}
          </span>
        ) : null}
      </summary>
      <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
        {hostMode === "vercel" ? (
          <div className="flex flex-wrap items-start justify-end gap-3">{headerActions}</div>
        ) : null}
        {body}
        {vercelDialog}
      </div>
    </details>
  );
}
