"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";

type SentryProject = {
  id: string;
  slug: string;
  name: string;
  platform?: string;
};

type SentryConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function SentryConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: SentryConnectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [projects, setProjects] = useState<SentryProject[]>([]);
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthDone, setOauthDone] = useState(false);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  function resetForm() {
    setStep(1);
    setProjects([]);
    setOrganizationSlug("");
    setSelectedProjectId("");
    setError(null);
    setOauthDone(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connectors/sentry/projects?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json()) as {
        projects?: SentryProject[];
        organizationSlug?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger les projets Sentry");
      }

      const list = data.projects ?? [];
      setProjects(list);
      setOrganizationSlug(data.organizationSlug ?? "");
      if (list.length === 1) {
        setSelectedProjectId(list[0]!.id);
      }
      setOauthDone(true);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des projets");
    } finally {
      setLoadingProjects(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!open) return;

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("sentry_oauth");
    if (oauthStatus === "1") {
      setOauthDone(true);
      void loadProjects();
      params.delete("sentry_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "token_error") {
      setError("Échange OAuth Sentry échoué. Réessayez ou vérifiez la configuration serveur.");
      params.delete("sentry_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "encryption_error") {
      setError("Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY).");
      params.delete("sentry_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [open, loadProjects]);

  function startOAuth() {
    window.location.href = `/api/connectors/sentry/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  async function handleConnect() {
    if (!selectedProjectId) {
      setError("Sélectionnez un projet Sentry.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        sentryProjectId: selectedProjectId,
        sentryProjectSlug: selectedProject?.slug,
        sentryProjectName: selectedProject?.name,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Sentry</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;intégration SaaS-Radar sur Sentry, puis choisissez le projet à
            monitorer. Métriques : issues ouvertes, taux d&apos;erreur et crash-free sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && !oauthDone ? (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Prérequis</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Public Integration Sentry configurée côté SaaS-Radar</li>
                  <li>Permissions : org:read, project:read, event:read, project:releases</li>
                  <li>Release Health activé pour le crash-free rate</li>
                </ul>
                <a
                  href="https://docs.sentry.io/integrations/integration-platform/public-integration/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Documentation Sentry Integration Platform
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button className="w-full" onClick={startOAuth}>
                Autoriser Sentry
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  void onConnect({ mode: "demo" }).then(() => handleOpenChange(false))
                }
              >
                Essayer en démo
              </Button>
            </>
          ) : null}

          {step === 2 || (oauthDone && step >= 2) ? (
            <>
              {organizationSlug ? (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Organisation :{" "}
                  <span className="font-medium text-foreground">{organizationSlug}</span>
                </div>
              ) : null}

              {loadingProjects ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des projets Sentry…
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="sentry-project">Projet Sentry</Label>
                  <select
                    id="sentry-project"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Sélectionner un projet…</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} · {project.slug}
                        {project.platform ? ` · ${project.platform}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun projet Sentry accessible. Vérifiez les permissions ou réautorisez
                  l&apos;accès.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  onClick={() => void handleConnect()}
                  disabled={connecting || loadingProjects || !selectedProjectId}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Synchronisation…
                    </>
                  ) : (
                    "Connecter ce projet"
                  )}
                </Button>
                <Button variant="outline" onClick={startOAuth} disabled={connecting}>
                  Changer d&apos;organisation
                </Button>
              </div>
            </>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
