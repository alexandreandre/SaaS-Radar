"use client";

import { useState } from "react";
import {
  Activity,
  ExternalLink,
  GitBranch,
  Loader2,
  Plus,
  Workflow,
} from "lucide-react";
import { BuildPlatformLogo } from "@/components/cockpit/build/build-tool-logo";
import { BuildCopyPrompt } from "@/components/cockpit/build/build-copy-prompt";
import { GitHubConnectDialog } from "@/components/cockpit/integrations/github-connect-dialog";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { ConnectorStreamPayload } from "@/lib/connectors/streams";
import {
  getGitHubRepoStream,
  getGitHubStreamsList,
  isGitHubMultiStream,
} from "@/lib/connectors/streams";
import {
  getGitHubReposForTool,
  hasGitHubTrackedRepos,
} from "@/lib/connectors/github/normalize";
import { getBuildGitHubAlert } from "@/lib/build/github-alerts";
import { getGitHubCursorPrompt, getGitHubManualSteps } from "@/lib/build/deploy-prompts";
import { getBuildTool, type BuildTool, type BuildToolId } from "@/lib/build/tools";
import type { BuildTrackingGithubMode } from "@/lib/build/tracking-profile";
import { getActiveBuildToolId, resolveProductName, type UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/contexts/portfolio-context";

type BuildGitHubTrackingProps = {
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

function RepoMetricsBlock({
  repoFullName,
  stream,
  compact,
}: {
  repoFullName: string;
  stream: ConnectorStreamPayload | undefined;
  compact?: boolean;
}) {
  const repoStream = getGitHubRepoStream(stream, repoFullName);
  if (!repoStream) {
    return (
      <p className="text-xs text-muted-foreground">
        Aucune métrique — synchronisez ce dépôt.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <GitBranch className="h-3.5 w-3.5" />
        {repoFullName}
        {repoStream.defaultBranch ? ` · ${repoStream.defaultBranch}` : ""}
        <a
          href={`https://github.com/${repoFullName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-muted-foreground hover:text-foreground"
          aria-label={`Ouvrir ${repoFullName}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </p>
      <div
        className={cn(
          "grid gap-3",
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        <MetricTile
          label="Commits (7j)"
          value={repoStream.commitsLast7d ?? 0}
          sub={
            repoStream.commitsDelta !== undefined
              ? `${repoStream.commitsDelta >= 0 ? "+" : ""}${repoStream.commitsDelta} vs sem. préc.`
              : undefined
          }
          tone={(repoStream.commitsLast7d ?? 0) > 0 ? "good" : "warn"}
        />
        <MetricTile
          label="CI / Actions"
          value={repoStream.lastWorkflowConclusion ?? "—"}
          tone={repoStream.lastWorkflowConclusion === "success" ? "good" : "warn"}
        />
        <MetricTile label="Étoiles" value={repoStream.stars ?? 0} sub="popularité" />
        <MetricTile label="PR ouvertes" value={repoStream.openPrs ?? 0} />
        <MetricTile label="Issues" value={repoStream.openIssues} />
        <MetricTile
          label="Santé build"
          value={`${repoStream.healthScore ?? 0}%`}
          tone={(repoStream.healthScore ?? 0) >= 70 ? "good" : "warn"}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5" />
        Vues 14j : {repoStream.viewsLast14d ?? 0}
        {repoStream.lastPushAt ? (
          <>
            <span>·</span>
            <Workflow className="h-3.5 w-3.5" />
            Dernier push : {new Date(repoStream.lastPushAt).toLocaleDateString("fr-FR")}
          </>
        ) : null}
      </div>
    </div>
  );
}

function TrackedRepoSection({
  title,
  repos,
  stream,
  compact,
}: {
  title: string;
  repos: Array<{
    repoFullName: string;
    linkedToolId?: string;
    isPrimary?: boolean;
  }>;
  stream: ConnectorStreamPayload | undefined;
  compact?: boolean;
}) {
  if (repos.length === 0) return null;

  return (
    <section className="space-y-3">
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {repos.map((repo) => (
        <div
          key={repo.repoFullName}
          className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2"
        >
          <div className="flex flex-wrap gap-1">
            {repo.isPrimary ? (
              <Badge variant="secondary" className="text-[10px]">
                Principal
              </Badge>
            ) : null}
            {repo.linkedToolId ? (
              <Badge variant="outline" className="text-[10px]">
                {getBuildTool(repo.linkedToolId as BuildToolId)?.name ?? repo.linkedToolId}
              </Badge>
            ) : null}
          </div>
          <RepoMetricsBlock
            repoFullName={repo.repoFullName}
            stream={stream}
            compact={compact}
          />
        </div>
      ))}
    </section>
  );
}

export function BuildGitHubTracking({
  project,
  opportunity,
  tool: toolProp,
  mode = "required",
  embedded = false,
}: BuildGitHubTrackingProps) {
  const { connectIntegration, autoSyncingProjectId, autoSyncingConnectors } = usePortfolio();
  const [dialogOpen, setDialogOpen] = useState(false);

  const syncing =
    autoSyncingProjectId === project.id && autoSyncingConnectors.includes("github");

  const stream = project.connectorStreams?.github;
  const alert = getBuildGitHubAlert(project, stream);
  const tracked = project.githubTrackedRepos ?? [];
  const hasTracked = hasGitHubTrackedRepos(project);

  const activeToolId = getActiveBuildToolId(project);
  const buildTool =
    toolProp ?? (activeToolId ? getBuildTool(activeToolId) : undefined);
  const activeToolLabel = buildTool?.name ?? "l'outil actif";

  const linkedRepos = getGitHubReposForTool(project, activeToolId);
  const otherRepos = tracked.filter((r) => r.linkedToolId !== activeToolId);

  const showCursorHelp =
    mode === "required" &&
    Boolean(opportunity && buildTool?.deployModel === "github-vercel" && !hasTracked);

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
            {hasTracked && isGitHubMultiStream(stream) ? (
              <span className="text-xs font-normal text-muted-foreground">
                · {getGitHubStreamsList(stream).length} dépôt
                {getGitHubStreamsList(stream).length > 1 ? "s" : ""}
              </span>
            ) : null}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {syncing ? (
            <span className="inline-flex items-center gap-1.5 self-center text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Synchronisation…
            </span>
          ) : null}
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {hasTracked ? "Ajouter un dépôt" : "Connecter GitHub"}
          </Button>
        </div>
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

      {hasTracked ? (
        <div className="space-y-4">
          {linkedRepos.length > 0 ? (
            <TrackedRepoSection
              title={`Repos liés à ${activeToolLabel}`}
              repos={linkedRepos}
              stream={stream}
              compact={embedded}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun dépôt lié à {activeToolLabel}. Ajoutez le repo que vous utilisez avec{" "}
              {activeToolLabel}.
            </p>
          )}
          <TrackedRepoSection
            title="Autres repos suivis"
            repos={otherRepos}
            stream={stream}
            compact={embedded}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {mode === "required" ? requiredHint : optionalHint}
        </p>
      )}

      <GitHubConnectDialog
        projectId={project.id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultLinkedToolId={activeToolId}
        trackedRepos={tracked}
        stream={stream}
        oauthModule="build"
        onConnect={(options) =>
          connectIntegration(project.id, "github", {
            ...options,
            linkedToolId: options?.linkedToolId ?? activeToolId,
          })
        }
      />
    </>
  );

  const wrappedContent =
    mode === "optional" && !hasTracked ? (
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
    if (mode === "optional" && !hasTracked) {
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

/** Alias historique (casse github) */
export const BuildGithubTracking = BuildGitHubTracking;
