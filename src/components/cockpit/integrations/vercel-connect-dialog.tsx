"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";

type VercelProject = {
  id: string;
  name: string;
  repo?: string;
};

type VercelStatus = {
  platformConfigured?: boolean;
  oauthConnected?: boolean;
};

type VercelConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
  onSyncConnected?: () => Promise<void>;
  returnTo?: "build" | "integrations";
};

const USER_FRIENDLY_ERRORS: Record<string, string> = {
  unavailable: "Connexion temporairement indisponible. Réessayez plus tard.",
  token_error: "La connexion a échoué. Réessayez.",
  no_projects: "Aucun projet Vercel trouvé sur ce compte.",
};

export function VercelConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
  onSyncConnected,
  returnTo = "integrations",
}: VercelConnectDialogProps) {
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [platformConfigured, setPlatformConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oauthDone, setOauthDone] = useState(false);
  const autoConnectAttempted = useRef(false);

  const hydrateConnected = useCallback(async () => {
    if (!onSyncConnected) return;
    setConnecting(true);
    setError(null);
    try {
      await onSyncConnected();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synchronisation échouée");
    } finally {
      setConnecting(false);
    }
  }, [onOpenChange, onSyncConnected]);

  const connectProject = useCallback(
    async (vercelProjectId: string) => {
      setConnecting(true);
      setError(null);
      try {
        await onConnect({ mode: "real", vercelProjectId });
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connexion échouée");
      } finally {
        setConnecting(false);
      }
    },
    [onConnect, onOpenChange],
  );

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/vercel/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action: "list_projects" }),
      });
      const data = (await res.json()) as {
        projects?: VercelProject[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger vos projets Vercel");
      }
      const list = data.projects ?? [];
      setProjects(list);
      if (list.length === 1) {
        setSelectedProjectId(list[0]!.id);
      }
      setOauthDone(true);

      if (list.length === 1 && !autoConnectAttempted.current) {
        autoConnectAttempted.current = true;
        await connectProject(list[0]!.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des projets");
    } finally {
      setLoadingProjects(false);
    }
  }, [connectProject, projectId]);

  const checkStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch(
        `/api/connectors/vercel/status?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json()) as VercelStatus;
      if (res.ok) {
        setPlatformConfigured(data.platformConfigured !== false);
      }
    } catch {
      setPlatformConfigured(true);
    } finally {
      setCheckingStatus(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSelectedProjectId("");
      setOauthDone(false);
      autoConnectAttempted.current = false;
      return;
    }

    void checkStatus();

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("vercel_oauth");

    if (oauthStatus === "connected") {
      params.delete("vercel_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
      void hydrateConnected();
      return;
    }

    if (oauthStatus === "1") {
      setOauthDone(true);
      void loadProjects();
      params.delete("vercel_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus && USER_FRIENDLY_ERRORS[oauthStatus]) {
      setError(USER_FRIENDLY_ERRORS[oauthStatus] ?? "Connexion échouée");
      params.delete("vercel_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [checkStatus, hydrateConnected, loadProjects, open]);

  function startOAuth() {
    window.location.href = `/api/connectors/vercel/oauth?projectId=${encodeURIComponent(projectId)}&returnTo=${returnTo}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Vercel</DialogTitle>
          <DialogDescription>
            Suivez vos deploys et l&apos;état de production en direct — sans clé API à copier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {checkingStatus ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Vérification…
            </div>
          ) : !platformConfigured ? (
            <p className="text-sm text-muted-foreground">
              La connexion Vercel en direct n&apos;est pas encore activée sur cette instance.
              Collez l&apos;URL de production dans le module Build en attendant.
            </p>
          ) : !oauthDone ? (
            <>
              <p className="text-sm text-muted-foreground">
                Connectez votre compte Vercel — il suffit d&apos;avoir au moins un projet hébergé.
              </p>
              <Button className="w-full" onClick={startOAuth}>
                Continuer avec Vercel
              </Button>
            </>
          ) : (
            <>
              {loadingProjects || connecting ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {connecting ? "Connexion en cours…" : "Chargement de vos projets…"}
                </div>
              ) : projects.length > 1 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quel projet suivre ?</p>
                  <div className="flex flex-wrap gap-2">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                          selectedProjectId === project.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        {project.name}
                        {project.repo ? ` (${project.repo})` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun projet accessible. Créez un projet sur Vercel puis réessayez.
                </p>
              ) : null}

              {projects.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => void connectProject(selectedProjectId)}
                    disabled={connecting || loadingProjects || !selectedProjectId}
                  >
                    Valider
                  </Button>
                  <Button variant="outline" onClick={startOAuth} disabled={connecting}>
                    Changer de compte
                  </Button>
                </div>
              ) : null}
            </>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
