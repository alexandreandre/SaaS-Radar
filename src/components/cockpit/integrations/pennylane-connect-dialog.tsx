"use client";

import { useEffect, useState } from "react";
import { ExternalLink, KeyRound, Loader2 } from "lucide-react";
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

type ValidateResponse = {
  accountLabel?: string;
  companyName?: string;
  scopes?: string[];
  sandbox?: boolean;
  hasTrialBalanceScope?: boolean;
  error?: string;
};

type PennylaneConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function PennylaneConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: PennylaneConnectDialogProps) {
  const [apiToken, setApiToken] = useState("");
  const [validated, setValidated] = useState<ValidateResponse | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setApiToken("");
    setValidated(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  useEffect(() => {
    if (!open) return;

    void fetch("/api/connectors/pennylane/oauth?check=1")
      .then((res) => res.json())
      .then((data: { configured?: boolean }) => {
        setOauthConfigured(Boolean(data.configured));
      })
      .catch(() => setOauthConfigured(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("pennylane_oauth");

    function clearOauthParam() {
      params.delete("pennylane_oauth");
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
          setError(err instanceof Error ? err.message : "Connexion Pennylane échouée");
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

  async function handleValidateToken() {
    if (!apiToken.trim()) {
      setError("Collez votre token API Pennylane.");
      return;
    }

    setValidating(true);
    setError(null);
    setValidated(null);
    try {
      const res = await fetch("/api/connectors/pennylane/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, apiToken: apiToken.trim() }),
      });
      const data = (await res.json()) as ValidateResponse;
      if (!res.ok) {
        throw new Error(data.error ?? "Validation Pennylane échouée");
      }
      if (!data.hasTrialBalanceScope) {
        throw new Error(
          "Ce token n'a pas la permission « Balance générale » (trial_balance:readonly). Régénérez un token en lecture seule avec cette permission.",
        );
      }
      setValidated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation Pennylane échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleConnectToken() {
    if (!apiToken.trim()) {
      setError("Collez votre token API Pennylane.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({ mode: "real", apiToken: apiToken.trim() });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion Pennylane échouée");
    } finally {
      setConnecting(false);
    }
  }

  function startOAuth() {
    window.location.href = `/api/connectors/pennylane/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Pennylane</DialogTitle>
          <DialogDescription>
            Synchronise le CA comptable, les charges et la TVA du mois en cours depuis votre
            comptabilité Pennylane.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              Token API entreprise
            </div>
            <p className="text-xs text-muted-foreground">
              Plan Essential+ requis. Paramètres → Connectivité → Développeurs → Générer un token
              API V2 en <strong>lecture seule</strong> avec la permission Balance générale.
            </p>
            <div className="space-y-2">
              <Label htmlFor="pennylane-api-token">Token API</Label>
              <input
                id="pennylane-api-token"
                type="password"
                autoComplete="off"
                value={apiToken}
                onChange={(e) => {
                  setApiToken(e.target.value);
                  setValidated(null);
                }}
                placeholder="Collez votre token Pennylane"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            {validated ? (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                <p className="font-medium">{validated.accountLabel ?? validated.companyName}</p>
                {validated.sandbox ? (
                  <p className="text-amber-600 dark:text-amber-400">Environnement sandbox détecté</p>
                ) : null}
                {validated.scopes?.length ? (
                  <p className="mt-1 text-muted-foreground">
                    Scopes : {validated.scopes.slice(0, 4).join(", ")}
                    {validated.scopes.length > 4 ? "…" : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleValidateToken()}
                disabled={validating || connecting || !apiToken.trim()}
              >
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Vérifier
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleConnectToken()}
                disabled={connecting || validating || !apiToken.trim()}
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Connecter
              </Button>
            </div>
            <a
              href="https://pennylane.readme.io/docs/generating-my-api-token"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Documentation Pennylane
              <ExternalLink className="h-3 w-3" />
            </a>
          </section>

          {oauthConfigured ? (
            <section className="space-y-3 rounded-lg border border-dashed border-border p-4">
              <p className="text-sm font-medium">Ou via OAuth plateforme</p>
              <p className="text-xs text-muted-foreground">
                Connexion « Sign in with Pennylane » si l&apos;application The Build Road est enregistrée
                chez Pennylane Partenariats.
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={startOAuth} disabled={connecting}>
                Se connecter avec Pennylane
              </Button>
            </section>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
