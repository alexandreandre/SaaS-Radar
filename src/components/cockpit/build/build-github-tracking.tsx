"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ExternalLink,
  GitBranch,
  Loader2,
  Workflow,
} from "lucide-react";
import { BuildPlatformLogo } from "@/components/cockpit/build/build-tool-logo";
import { BuildCopyPrompt } from "@/components/cockpit/build/build-copy-prompt";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { DevStream } from "@/lib/connectors/streams";
import type { UserProject } from "@/lib/portfolio";
import { resolveProductName } from "@/lib/portfolio";
import { getActiveBuildToolId } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import type { BuildTool } from "@/lib/build/tools";
import type { BuildTrackingGithubMode } from "@/lib/build/tracking-profile";
import { getBuildGitHubAlert } from "@/lib/build/github-alerts";
import { getGitHubCursorPrompt, getGitHubManualSteps } from "@/lib/build/deploy-prompts";
import { getBuildTool } from "@/lib/build/tools";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/contexts/portfolio-context";
import { mergeDetectedProductLogo } from "@/lib/build/product-logo-client";
import type { ProductLogo } from "@/lib/portfolio";
import { useSearchParams } from "next/navigation";

type BuildGithubTrackingProps = {
  project: UserProject;
  opportunity?: Opportunity;
  tool?: BuildTool;
  mode?: BuildTrackingGithubMode;
  onModuleChange?: (module: CockpitModuleId) => void;
  embedded?: boolean;
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

export function BuildGithubTracking({
  project,
  opportunity,
  tool: toolProp,
  mode = "required",
  embedded = false,
}: BuildGithubTrackingProps) {
  const { setGitHubConnection, updateProject } = usePortfolio();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<{ fullName: string; private: boolean }[]>([]);
  const [selectedRepo, setSelectedRepo] = useState(project.githubConnection?.repoFullName ?? "");

  const stream = project.connectorStreams?.github as DevStream | undefined;
  const alert = getBuildGitHubAlert(project, stream);

  const buildTool =
    toolProp ??
    (getActiveBuildToolId(project) ? getBuildTool(getActiveBuildToolId(project)!) : undefined);

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
        const baseUpdated: UserProject = {
          ...project,
          githubConnection: data.connection,
          connectorStreams: {
            ...project.connectorStreams,
            github: data.stream,
          },
        };
        const withLogo = mergeDetectedProductLogo(
          baseUpdated,
          data.productLogo as ProductLogo | undefined,
        );
        const updated = withLogo ?? baseUpdated;
        updateProject(project.id, {
          githubConnection: data.connection,
          connectorStreams: updated.connectorStreams,
          ...(withLogo ? { productLogo: withLogo.productLogo } : {}),
        });
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
  const showCursorHelp =
    mode === "required" &&
    Boolean(opportunity && buildTool?.deployModel === "github-vercel" && !project.githubConnection);

  const optionalHint = buildTool
    ? `Si vous avez activé la sync GitHub dans ${buildTool.name}, liez le repo ici pour suivre commits et CI — ce n'est pas requis pour publier.`
    : "Liez votre repo pour suivre commits, CI et momentum — sans quitter le cockpit.";

  const requiredHint =
    "Une fois le code sur GitHub, connectez-le ici pour suivre commits et déploiements.";

  const content = (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {!embedded ? (
            <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
              Suivi
            </p>
          ) : null}
          <h3
            className={cn(
              "flex items-center gap-2 font-semibold",
              embedded ? "text-base" : "mt-1 text-lg",
            )}
          >
            <BuildPlatformLogo platform="github" size="sm" />
            GitHub
            {mode === "optional" ? (
              <span className="text-xs font-normal text-muted-foreground">(optionnel)</span>
            ) : null}
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

      {showCursorHelp && opportunity && buildTool ? (
        <details className="mb-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            Pas encore sur GitHub ? Création manuelle ou aide Cursor
          </summary>
          <div className="space-y-3 border-t border-primary/20 p-3">
            <ol className="space-y-1 text-xs leading-relaxed text-muted-foreground">
              {getGitHubManualSteps(resolveProductName(project, opportunity)).map((line, i) => (
                <li key={i}>
                  <span className="font-medium text-primary">{i + 1}. </span>
                  {line}
                </li>
              ))}
            </ol>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
              <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">
                <BuildPlatformLogo platform="github" size="sm" variant="inline" />
                github.com/new
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <BuildCopyPrompt
              label={`Si vous bloquez — prompt ${buildTool.name}`}
              text={getGitHubCursorPrompt(buildTool, resolveProductName(project, opportunity))}
              compact
            />
          </div>
        </details>
      ) : null}

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
          {mode === "required" ? requiredHint : optionalHint}
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </>
  );

  const wrappedContent =
    mode === "optional" && !project.githubConnection ? (
      <details open className="rounded-lg border border-dashed border-border bg-muted/10">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
          Optionnel — lier GitHub pour suivre le code
        </summary>
        <div className="border-t border-border p-4">{content}</div>
      </details>
    ) : (
      content
    );

  if (embedded) {
    if (mode === "optional" && !project.githubConnection) {
      return wrappedContent;
    }
    return <div className="rounded-lg border border-border bg-muted/10 p-4">{wrappedContent}</div>;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      {wrappedContent}
    </section>
  );
}
