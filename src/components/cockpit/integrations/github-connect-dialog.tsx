"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Star, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";
import { usePortfolio } from "@/contexts/portfolio-context";
import type { BuildToolId } from "@/lib/build/tools";
import { getBuildTool } from "@/lib/build/tools";
import type { GitHubTrackedRepo } from "@/lib/portfolio";
import type { ConnectorStreamPayload } from "@/lib/connectors/streams";
import {
  getGitHubRepoStream,
} from "@/lib/connectors/streams";
import { GITHUB_MAX_TRACKED_REPOS } from "@/lib/connectors/github/types";

type GitHubRepo = {
  fullName: string;
  private: boolean;
};

export type GitHubManageDialogProps = {
  projectId: string;
  trackedRepos: GitHubTrackedRepo[];
  stream?: ConnectorStreamPayload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
  defaultLinkedToolId?: BuildToolId;
  oauthModule?: "build";
};

export function GitHubManageDialog({
  projectId,
  trackedRepos,
  stream,
  open,
  onOpenChange,
  onConnect,
  defaultLinkedToolId,
  oauthModule,
}: GitHubManageDialogProps) {
  const { syncIntegration, removeGitHubRepo } = usePortfolio();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [tracked, setTracked] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncingRepo, setSyncingRepo] = useState<string | null>(null);
  const [removingRepo, setRemovingRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthDone, setOauthDone] = useState(trackedRepos.length > 0);

  const atLimit = trackedRepos.length >= GITHUB_MAX_TRACKED_REPOS;

  const loadRepos = useCallback(async () => {
    setLoadingRepos(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connectors/github/repos?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json()) as {
        repos?: GitHubRepo[];
        tracked?: string[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger les dépôts GitHub");
      }
      setRepos(data.repos ?? []);
      setTracked(data.tracked ?? []);
      setOauthDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des dépôts");
    } finally {
      setLoadingRepos(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSelectedRepo("");
      return;
    }

    if (trackedRepos.length > 0) {
      setOauthDone(true);
      void loadRepos();
    }

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("github_oauth");
    if (oauthStatus === "1") {
      setOauthDone(true);
      void loadRepos();
      params.delete("github_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "encryption_error") {
      setError("Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY).");
      params.delete("github_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [open, loadRepos, trackedRepos.length]);

  function startOAuth() {
    const moduleQuery = oauthModule === "build" ? "&module=build" : "";
    window.location.href = `/api/connectors/github/oauth?projectId=${encodeURIComponent(projectId)}${moduleQuery}`;
  }

  async function handleAddRepo() {
    if (!selectedRepo) {
      setError("Sélectionnez un dépôt GitHub.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        repoFullName: selectedRepo,
        linkedToolId: defaultLinkedToolId,
        setPrimary: trackedRepos.length === 0,
      });
      setSelectedRepo("");
      await loadRepos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout échoué");
    } finally {
      setConnecting(false);
    }
  }

  async function handleSyncRepo(_repoFullName: string) {
    setSyncingRepo(_repoFullName);
    setError(null);
    try {
      await syncIntegration(projectId, "github");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync échouée");
    } finally {
      setSyncingRepo(null);
    }
  }

  async function handleRemoveRepo(repoFullName: string) {
    setRemovingRepo(repoFullName);
    setError(null);
    try {
      await removeGitHubRepo(projectId, repoFullName);
      await loadRepos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retrait échoué");
    } finally {
      setRemovingRepo(null);
    }
  }

  async function handleSetPrimary(repoFullName: string) {
    setError(null);
    try {
      const res = await fetch("/api/connectors/github/repos/primary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, repoFullName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await syncIntegration(projectId, "github");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleUnlinkTool(repoFullName: string) {
    setError(null);
    try {
      const res = await fetch("/api/connectors/github/repos/link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, repoFullName, linkedToolId: null }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await syncIntegration(projectId, "github");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  const availableRepos = repos.filter((r) => !tracked.includes(r.fullName));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dépôts GitHub</DialogTitle>
          <DialogDescription>
            Suivez jusqu&apos;à {GITHUB_MAX_TRACKED_REPOS} dépôts en parallèle — idéal si vous
            testez plusieurs outils (Lovable, Cursor…).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!oauthDone ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Installez l&apos;app pour autoriser l&apos;accès lecture aux dépôts choisis.
              </p>
              <Button type="button" onClick={startOAuth} className="w-full">
                Installer l&apos;app GitHub
              </Button>
            </div>
          ) : (
            <>
              {trackedRepos.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Dépôts suivis ({trackedRepos.length}/{GITHUB_MAX_TRACKED_REPOS})
                  </p>
                  <ul className="space-y-2">
                    {trackedRepos.map((repo) => {
                      const repoStream = getGitHubRepoStream(stream, repo.repoFullName);
                      const tool = repo.linkedToolId ? getBuildTool(repo.linkedToolId) : undefined;
                      return (
                        <li
                          key={repo.repoFullName}
                          className="rounded-lg border border-border bg-muted/20 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-sm">{repo.repoFullName}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {repo.isPrimary ? (
                                  <Badge variant="outline" className="text-[10px]">
                                    Principal
                                  </Badge>
                                ) : null}
                                {tool ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {tool.name}
                                  </Badge>
                                ) : null}
                              </div>
                              {repoStream ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {repoStream.commitsLast7d ?? 0} commits/7j · CI{" "}
                                  {repoStream.lastWorkflowConclusion ?? "—"}
                                  {repoStream.stars != null ? (
                                    <>
                                      {" "}
                                      · <Star className="inline h-3 w-3" /> {repoStream.stars}
                                    </>
                                  ) : null}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {!repo.isPrimary ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => void handleSetPrimary(repo.repoFullName)}
                                >
                                  Principal
                                </Button>
                              ) : null}
                              {repo.linkedToolId ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => void handleUnlinkTool(repo.repoFullName)}
                                >
                                  Délier
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={syncingRepo === repo.repoFullName}
                                onClick={() => void handleSyncRepo(repo.repoFullName)}
                              >
                                {syncingRepo === repo.repoFullName ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Sync"
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive"
                                disabled={removingRepo === repo.repoFullName}
                                onClick={() => void handleRemoveRepo(repo.repoFullName)}
                              >
                                {removingRepo === repo.repoFullName ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {!atLimit ? (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Ajouter un dépôt
                  </p>
                  {loadingRepos ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement…
                    </div>
                  ) : availableRepos.length > 0 ? (
                    <>
                      <Label htmlFor="github-repo-add">Dépôt</Label>
                      <select
                        id="github-repo-add"
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Sélectionner…</option>
                        {availableRepos.map((repo) => (
                          <option key={repo.fullName} value={repo.fullName}>
                            {repo.fullName}
                            {repo.private ? " (privé)" : ""}
                          </option>
                        ))}
                      </select>
                      {defaultLinkedToolId ? (
                        <p className="text-xs text-muted-foreground">
                          Sera lié à {getBuildTool(defaultLinkedToolId)?.name ?? defaultLinkedToolId}
                        </p>
                      ) : null}
                      <Button
                        type="button"
                        onClick={() => void handleAddRepo()}
                        disabled={connecting || !selectedRepo}
                      >
                        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {repos.length === 0
                        ? "Aucun dépôt accessible — réinstallez l'app sur les dépôts souhaités."
                        : "Tous les dépôts accessibles sont déjà suivis."}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Limite de {GITHUB_MAX_TRACKED_REPOS} dépôts atteinte. Retirez un dépôt pour en
                  ajouter un autre.
                </p>
              )}

              <Button type="button" variant="outline" size="sm" onClick={startOAuth}>
                Réinstaller l&apos;app
              </Button>
            </>
          )}

          <Button type="button" variant="ghost" size="sm" asChild>
            <a
              href="https://docs.github.com/en/apps/creating-github-apps"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation GitHub Apps
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated alias */
export const GitHubConnectDialog = GitHubManageDialog;
