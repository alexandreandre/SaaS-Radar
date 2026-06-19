"use client";

import { useState } from "react";
import { ExternalLink, KeyRound } from "lucide-react";
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
  companyId?: string;
  error?: string;
};

type AbbyConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function AbbyConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: AbbyConnectDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [validated, setValidated] = useState<ValidateResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenueWarning, setRevenueWarning] = useState<string | null>(null);

  function resetForm() {
    setApiKey("");
    setValidated(null);
    setError(null);
    setRevenueWarning(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidateKey() {
    if (!apiKey.trim()) {
      setError("Collez votre clé API Abby.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/abby/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, apiKey: apiKey.trim() }),
      });
      const data = (await res.json()) as ValidateResponse;
      if (!res.ok) {
        throw new Error(data.error ?? "Validation Abby échouée");
      }

      setValidated(data);
    } catch (err) {
      setValidated(null);
      setError(err instanceof Error ? err.message : "Validation Abby échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect() {
    if (!apiKey.trim()) {
      setError("Collez votre clé API Abby.");
      return;
    }

    setConnecting(true);
    setError(null);
    setRevenueWarning(null);
    try {
      await onConnect({
        mode: "real",
        apiKey: apiKey.trim(),
      });
      handleOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connexion Abby échouée";
      if (message.toLowerCase().includes("ca comptable")) {
        setRevenueWarning(message);
      }
      setError(message);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Connecter Abby
          </DialogTitle>
          <DialogDescription>
            Synchronisez CA comptable, charges et TVA depuis votre compte Abby (compta micro-entreprise
            FR).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p>
              Créez une clé API dans Abby →{" "}
              <a
                href="https://app.abby.fr/settings/integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                Intégrations
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="abby-api-key">Clé API Abby</Label>
            <input
              id="abby-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setValidated(null);
                setError(null);
              }}
              placeholder="eyJ…"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm"
            />
          </div>

          {validated ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
              <p className="font-medium text-foreground">
                {validated.accountLabel ?? validated.companyName ?? "Compte Abby"}
              </p>
              {validated.companyId ? (
                <p className="mt-1 text-muted-foreground">ID société : {validated.companyId}</p>
              ) : null}
            </div>
          ) : null}

          {revenueWarning ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-900 dark:text-amber-200">
              {revenueWarning}
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleValidateKey()}
              disabled={validating || connecting || !apiKey.trim()}
            >
              {validating ? "Validation…" : "Valider la clé"}
            </Button>
            <Button
              type="button"
              onClick={() => void handleConnect()}
              disabled={connecting || !apiKey.trim()}
            >
              {connecting ? "Connexion…" : "Connecter Abby"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
