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

type StripeRakDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

const RAK_PERMISSIONS = [
  "Analytics — Read",
  "Subscriptions — Read",
  "Invoices — Read",
];

export function StripeRakDialog({ open, onOpenChange, onConnect }: StripeRakDialogProps) {
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRakConnect() {
    if (!secretKey.trim()) {
      setError("Collez votre clé restreinte Stripe (rk_test_… ou rk_live_…).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConnect({ mode: "real", secretKey: secretKey.trim(), currency: "eur" });
      setSecretKey("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Clé restreinte Stripe</DialogTitle>
          <DialogDescription>
            Alternative à la connexion OAuth. Accès lecture seule — SaaS Radar ne peut pas modifier
            vos paiements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe-rak">Clé restreinte (rk_…)</Label>
            <input
              id="stripe-rak"
              type="password"
              autoComplete="off"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="rk_test_… ou rk_live_…"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Permissions minimales</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {RAK_PERMISSIONS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <a
              href="https://dashboard.stripe.com/apikeys/create"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
            >
              Créer une clé restreinte
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Button className="w-full" onClick={() => void handleRakConnect()} disabled={loading}>
            <KeyRound className="h-4 w-4" />
            {loading ? "Connexion…" : "Valider la clé"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Utiliser StripeRakDialog */
export const StripeConnectDialog = StripeRakDialog;
