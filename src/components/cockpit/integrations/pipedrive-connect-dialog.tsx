"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";

type PipedriveConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function PipedriveConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: PipedriveConnectDialogProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("pipedrive_oauth");

    function clearOauthParam() {
      params.delete("pipedrive_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }

    if (oauthStatus === "1") {
      clearOauthParam();
      void (async () => {
        setConnecting(true);
        setError(null);
        try {
          await onConnect({ mode: "real" });
          onOpenChange(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Connexion Pipedrive échouée");
        } finally {
          setConnecting(false);
        }
      })();
      return;
    }

    if (oauthStatus === "token_error") {
      setError("Échange OAuth échoué. Réessayez ou vérifiez la configuration serveur.");
      clearOauthParam();
    } else if (oauthStatus === "encryption_error") {
      setError("Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY).");
      clearOauthParam();
    }
  }, [open, onConnect, onOpenChange]);

  function startOAuth() {
    window.location.href = `/api/connectors/pipedrive/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Pipedrive</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;accès à votre compte Pipedrive pour synchroniser le pipeline, les deals
            gagnés/perdus et le cycle de vente moyen dans le module Clients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Prérequis</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>App OAuth créée dans le Pipedrive Developer Hub</li>
              <li>Scope : deals:read (base inclus automatiquement)</li>
              <li>Redirect URI HTTPS vers /api/connectors/pipedrive/callback</li>
            </ul>
            <a
              href="https://pipedrive.readme.io/docs/marketplace-oauth-authorization"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
            >
              Documentation OAuth Pipedrive
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <Button className="w-full" onClick={startOAuth} disabled={connecting}>
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Synchronisation…
              </>
            ) : (
              "Continuer avec Pipedrive"
            )}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
