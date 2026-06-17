"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Globe, Loader2 } from "lucide-react";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { UserProject } from "@/lib/portfolio";
import { getUnifiedDeployStatus } from "@/lib/build/deploy-status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/contexts/portfolio-context";
import { queueProjectMetricsSync } from "@/lib/portfolio-sync-client";
import { useSearchParams } from "next/navigation";

type BuildHostTrackingProps = {
  project: UserProject;
  onModuleChange?: (module: CockpitModuleId) => void;
};

export function BuildHostTracking({ project, onModuleChange }: BuildHostTrackingProps) {
  const { setHostConnection, updateProject } = usePortfolio();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(project.hostConnection?.productionUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vercelProjects, setVercelProjects] = useState<
    { id: string; name: string; repo?: string }[]
  >([]);

  const deployStatus = getUnifiedDeployStatus(project);
  const vercelStream = project.connectorStreams?.vercel;

  const handleSave = () => {
    if (!url.trim()) return;
    setHostConnection(project.id, {
      provider: "vercel",
      productionUrl: url.trim(),
      connectedAt: new Date().toISOString(),
    });
  };

  const loadVercelProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/vercel/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, action: "list_projects" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Liste projets échouée");
      setVercelProjects(data.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  const syncVercelProject = useCallback(
    async (vercelProjectId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/connectors/vercel/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, vercelProjectId, action: "sync" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Sync Vercel échouée");

        setHostConnection(project.id, data.connection);
        const updated = {
          ...project,
          hostConnection: data.connection,
          connectorStreams: {
            ...project.connectorStreams,
            vercel: data.stream,
          },
        };
        updateProject(project.id, {
          hostConnection: data.connection,
          connectorStreams: updated.connectorStreams,
        });
        if (data.connection.productionUrl) setUrl(data.connection.productionUrl);
        queueProjectMetricsSync(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setLoading(false);
      }
    },
    [project, setHostConnection, updateProject],
  );

  useEffect(() => {
    if (searchParams.get("vercel_connected") === "1") {
      void loadVercelProjects();
    }
  }, [searchParams, loadVercelProjects]);

  const handleConnectVercel = () => {
    window.location.href = `/api/connectors/vercel/oauth?projectId=${encodeURIComponent(project.id)}`;
  };

  return (
    <details className="rounded-xl border border-border bg-card shadow-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Hébergement & déploiement</span>
        {deployStatus ? (
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
          <p className="text-sm text-muted-foreground">
            Connectez Vercel ou indiquez l&apos;URL de production pour unifier le suivi avec GitHub.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={handleConnectVercel}>
            Connecter Vercel (OAuth)
          </Button>
          {vercelProjects.length > 0 ? null : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={() => void loadVercelProjects()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Charger mes projets"}
            </Button>
          )}
        </div>

        {vercelProjects.length > 0 ? (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Sélectionnez un projet Vercel :</p>
            <div className="flex flex-wrap gap-2">
              {vercelProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={loading}
                  onClick={() => void syncVercelProject(p.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/50"
                >
                  {p.name}
                  {p.repo ? ` (${p.repo})` : ""}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://votre-app.vercel.app"
            className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="button" size="sm" onClick={handleSave}>
            Enregistrer URL
          </Button>
        </div>

        {vercelStream?.type === "dev" ? (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Uptime Vercel</p>
              <p className="font-semibold">{vercelStream.uptimePct} %</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Deploys 30j</p>
              <p className="font-semibold">{vercelStream.deploysLast30d}</p>
            </div>
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
    </details>
  );
}
