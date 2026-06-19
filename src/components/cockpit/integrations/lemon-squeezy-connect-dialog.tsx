"use client";

import { useEffect, useState } from "react";
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

type LemonSqueezyStore = {
  id: string;
  name: string;
  currency: string;
  testMode: boolean;
};

type LemonSqueezyConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function LemonSqueezyConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: LemonSqueezyConnectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKey, setApiKey] = useState("");
  const [stores, setStores] = useState<LemonSqueezyStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setStep(1);
    setApiKey("");
    setStores([]);
    setSelectedStoreId("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  useEffect(() => {
    if (stores.length === 1 && !selectedStoreId) {
      setSelectedStoreId(stores[0]!.id);
    }
  }, [stores, selectedStoreId]);

  async function handleValidate() {
    if (!apiKey.trim()) {
      setError("Collez votre clé API Lemon Squeezy.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/lemon-squeezy/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          apiKey: apiKey.trim(),
        }),
      });
      const data = (await res.json()) as {
        stores?: LemonSqueezyStore[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      const list = data.stores ?? [];
      if (list.length === 0) {
        throw new Error("Aucune boutique trouvée pour cette clé.");
      }

      setStores(list);
      setSelectedStoreId(list.length === 1 ? list[0]!.id : "");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect() {
    const store = stores.find((s) => s.id === selectedStoreId);
    if (!store) {
      setError("Sélectionnez une boutique.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        apiKey: apiKey.trim(),
        storeId: store.id,
        storeName: store.name,
        currency: store.currency,
        testMode: store.testMode,
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setConnecting(false);
    }
  }

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Lemon Squeezy</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Clé API créée dans Settings → API. Accès lecture aux abonnements de votre boutique."
              : "Choisissez la boutique à synchroniser avec le cockpit revenus."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ls-api-key">Clé API</Label>
              <input
                id="ls-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Collez votre clé API Lemon Squeezy"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Compte Lemon Squeezy avec au moins une boutique</li>
                <li>Clé API en mode test ou live selon votre environnement</li>
                <li>Abonnements actifs pour alimenter MRR et clients</li>
              </ul>
              <a
                href="https://app.lemonsqueezy.com/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Créer une clé API
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button className="w-full" onClick={() => void handleValidate()} disabled={validating}>
              <KeyRound className="h-4 w-4" />
              {validating ? "Validation…" : "Valider la clé"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stores.length > 1 ? (
              <div className="space-y-2">
                <Label htmlFor="ls-store">Boutique</Label>
                <select
                  id="ls-store"
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sélectionnez une boutique</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.currency}
                      {store.testMode ? ", test" : ""})
                    </option>
                  ))}
                </select>
              </div>
            ) : selectedStore ? (
              <p className="text-sm text-muted-foreground">
                Boutique : <span className="font-medium text-foreground">{selectedStore.name}</span>
                {selectedStore.testMode ? " (mode test)" : ""}
              </p>
            ) : null}

            <Button
              className="w-full"
              onClick={() => void handleConnect()}
              disabled={connecting || !selectedStoreId}
            >
              {connecting ? "Connexion…" : "Connecter"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={connecting}>
              Retour
            </Button>
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
