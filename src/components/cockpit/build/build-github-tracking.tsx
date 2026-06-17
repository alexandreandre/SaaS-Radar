"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  GitBranch,
  Github,
  Loader2,
  Star,
  Workflow,
} from "lucide-react";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { DevStream } from "@/lib/connectors/streams";
import type { UserProject } from "@/lib/portfolio";
import { getBuildGitHubAlert } from "@/lib/build/github-alerts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/contexts/portfolio-context";
import { queueProjectMetricsSync } from "@/lib/portfolio-sync-client";
import { useSearchParams } from "next/navigation";

type BuildGithubTrackingProps = {
  project: UserProject;
  onModuleChange?: (module: CockpitModuleId) => void;
};

function MetricTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-data text-xl font-semibold tabular-nums",
          tone === "good" && "text-emerald-600",
          tone === "warn" && "text-amber-600",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function BuildGithubTracking({ project }: BuildGithubTrackingProps) {
  const { setGitHubConnection, updateProject } = usePortfolio();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<{ fullName: string; private: boolean }[]>([]);
  const [selectedRepo, setSelectedRepo] = useState(project.githubConnection?.repoFullName ?? "");

  const stream = project.connectorStreams?.github as DevStream | undefined;
  const alert = getBuildGitHubAlert(project, stream);

  const syncRepo = useCallback(
    async (installationId: number, repoFullName: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/connectors/github/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ installationId, repoFullName, action: "sync" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Sync échouée");

        setGitHubConnection(project.id, data.connection);
        const updated: UserProject = {
          ...project,
          githubConnection: data.connection,
          connectorStreams: {
            ...project.connectorStreams,
            github: data.stream,
          },
        };
        updateProject(project.id, {
          githubConnection: data.connection,
          connectorStreams: updated.connectorStreams,
        });
        queueProjectMetricsSync(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setLoading(false);
      }
    },
    [project, setGitHubConnection, updateProject],
  );

  const loadRepos = useCallback(async (installationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId, action: "list_repos" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Liste repos échouée");
      setRepos(data.repos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const installId = searchParams.get("github_install");
    if (!installId) return;
    const installationId = parseInt(installId, 10);
    if (!Number.isFinite(installationId)) return;
    void loadRepos(installationId);
    setGitHubConnection(project.id, {
      repoFullName: "",
      installationId,
      connectedAt: new Date().toISOString(),
    });
  }, [searchParams, project.id, loadRepos, setGitHubConnection]);

  const handleConnect = () => {
    window.location.href = `/api/connectors/github/oauth?projectId=${encodeURIComponent(project.id)}`;
  };

  const installationId = project.githubConnection?.installationId;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
            Suivi
          </p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <Github className="h-5 w-5" />
            GitHub
          </h3>
        </div>
        {!project.githubConnection ? (
          <Button type="button" size="sm" onClick={handleConnect}>
            Connecter GitHub
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || !selectedRepo}
            onClick={() => {
              if (installationId && selectedRepo) {
                void syncRepo(installationId, selectedRepo);
              }
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Synchroniser"}
          </Button>
        )}
      </div>

      {alert ? (
        <div
          className={cn(
            "mb-4 rounded-lg border px-3 py-2 text-sm",
            alert.severity === "critical" && "border-destructive/40 bg-destructive/5",
            alert.severity === "warning" && "border-amber-500/30 bg-amber-500/5",
            alert.severity === "info" && "border-border bg-muted/30",
          )}
        >
          {alert.message}
        </div>
      ) : null}

      {installationId && repos.length > 0 && !project.githubConnection?.repoFullName ? (
        <div className="mb-4">
          <p className="mb-2 text-sm text-muted-foreground">Sélectionnez votre repo :</p>
          <div className="flex flex-wrap gap-2">
            {repos.map((r) => (
              <button
                key={r.fullName}
                type="button"
                onClick={() => {
                  setSelectedRepo(r.fullName);
                  void syncRepo(installationId, r.fullName);
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/50"
              >
                {r.fullName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {project.githubConnection?.repoFullName && stream?.type === "dev" ? (
        <>
          <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" />
            {stream.repoFullName ?? project.githubConnection.repoFullName}
            {stream.defaultBranch ? ` · ${stream.defaultBranch}` : ""}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricTile
              label="Commits (7j)"
              value={stream.commitsLast7d ?? 0}
              sub={
                stream.commitsDelta !== undefined
                  ? `${stream.commitsDelta >= 0 ? "+" : ""}${stream.commitsDelta} vs sem. préc.`
                  : undefined
              }
              tone={(stream.commitsLast7d ?? 0) > 0 ? "good" : "warn"}
            />
            <MetricTile
              label="CI / Actions"
              value={stream.lastWorkflowConclusion ?? "—"}
              tone={stream.lastWorkflowConclusion === "success" ? "good" : "warn"}
            />
            <MetricTile label="Étoiles" value={stream.stars ?? 0} sub="popularité" />
            <MetricTile label="PR ouvertes" value={stream.openPrs ?? 0} />
            <MetricTile label="Issues" value={stream.openIssues} />
            <MetricTile
              label="Santé build"
              value={`${stream.healthScore ?? 0}%`}
              tone={(stream.healthScore ?? 0) >= 70 ? "good" : "warn"}
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Vues 14j : {stream.viewsLast14d ?? 0}
            {stream.lastPushAt ? (
              <>
                <span>·</span>
                <Workflow className="h-3.5 w-3.5" />
                Dernier push : {new Date(stream.lastPushAt).toLocaleDateString("fr-FR")}
              </>
            ) : null}
          </div>
        </>
      ) : !project.githubConnection ? (
        <p className="text-sm text-muted-foreground">
          Liez votre repo pour suivre commits, CI, issues et momentum — sans quitter le cockpit.
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
