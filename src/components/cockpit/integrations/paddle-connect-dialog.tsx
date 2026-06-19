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

type PaddleConnectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

const PADDLE_PERMISSIONS = [
  "metrics.read — MRR et abonnés actifs",
  "subscription.read — nouveau MRR et churn",
  "transaction.read — paiements échoués / récupérés",
];

export function PaddleConnectDialog({
  open,
  onOpenChange,
  onConnect,
}: PaddleConnectDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setApiKey("");
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleConnect() {
    if (!apiKey.trim()) {
      setError("Collez votre clé API Paddle (pdl_live_apikey_… ou pdl_sdbx_apikey_…).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConnect({ mode: "real", apiKey: apiKey.trim() });
      setApiKey("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Paddle</DialogTitle>
          <DialogDescription>
            Clé API Billing Paddle en lecture seule. SaaS Radar synchronise MRR, clients et
            paiements sans modifier votre compte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paddle-api-key">Clé API</Label>
            <input
              id="paddle-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pdl_live_apikey_… ou pdl_sdbx_apikey_…"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Permissions minimales</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {PADDLE_PERMISSIONS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <a
              href="https://vendors.paddle.com/authentication-v2"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
            >
              Créer une clé API Paddle
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Button className="w-full" onClick={() => void handleConnect()} disabled={loading}>
            <KeyRound className="h-4 w-4" />
            {loading ? "Connexion…" : "Connecter"}
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
