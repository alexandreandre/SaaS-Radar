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
import { Label } from "@/components/ui/label";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";

type ZendeskConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

function normalizeSubdomainInput(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/\.zendesk\.com(?:\/.*)?$/, "");
  return value.split("/")[0] ?? value;
}

export function ZendeskConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: ZendeskConnectDialogProps) {
  const [subdomain, setSubdomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("zendesk_oauth");

    function clearOauthParam() {
      params.delete("zendesk_oauth");
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
          setError(err instanceof Error ? err.message : "Connexion Zendesk échouée");
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
    const normalized = normalizeSubdomainInput(subdomain);
    if (!normalized) {
      setError("Saisissez votre subdomain Zendesk (ex. acme pour acme.zendesk.com).");
      return;
    }

    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized)) {
      setError("Subdomain invalide. Utilisez uniquement des lettres, chiffres et tirets.");
      return;
    }

    setError(null);
    window.location.href = `/api/connectors/zendesk/oauth?projectId=${encodeURIComponent(projectId)}&subdomain=${encodeURIComponent(normalized)}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Zendesk</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;accès à votre help desk Zendesk pour synchroniser les utilisateurs actifs,
            les tickets ouverts, le temps de réponse et le CSAT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zendesk-subdomain">Subdomain Zendesk</Label>
            <div className="flex items-center gap-2">
              <input
                id="zendesk-subdomain"
                placeholder="acme"
                value={subdomain}
                onChange={(event) => setSubdomain(event.target.value)}
                disabled={connecting}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
              <span className="shrink-0 text-sm text-muted-foreground">.zendesk.com</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Visible dans l&apos;URL de votre compte : https://votre-subdomain.zendesk.com
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Prérequis</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Global OAuth client approuvé via le Zendesk Marketplace portal</li>
              <li>Scope read sur l&apos;app OAuth</li>
              <li>Redirect URI HTTPS vers /api/connectors/zendesk/callback</li>
            </ul>
            <a
              href="https://developer.zendesk.com/documentation/marketplace/building-a-marketplace-app/set-up-a-global-oauth-client/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
            >
              Documentation Global OAuth Zendesk
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
              "Continuer avec Zendesk"
            )}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
