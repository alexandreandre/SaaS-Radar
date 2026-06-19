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

type QontoConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function QontoConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: QontoConnectDialogProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("qonto_oauth");

    function clearOauthParam() {
      params.delete("qonto_oauth");
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
          setError(err instanceof Error ? err.message : "Connexion Qonto échouée");
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
    window.location.href = `/api/connectors/qonto/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Qonto</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;accès à votre organisation Qonto pour synchroniser la trésorerie,
            les flux mensuels et le runway réel dans le module Finance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Prérequis</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>App OAuth créée dans le Qonto Developer Portal</li>
              <li>Scopes : organization.read et offline_access</li>
              <li>Redirect URI HTTPS vers /api/connectors/qonto/callback</li>
              <li>Compte owner ou admin pour lire les soldes complets</li>
            </ul>
            <a
              href="https://docs.qonto.com/get-started/business-api/authentication/oauth/oauth-flow"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
            >
              Documentation OAuth Qonto
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
              "Connecter avec Qonto"
            )}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
