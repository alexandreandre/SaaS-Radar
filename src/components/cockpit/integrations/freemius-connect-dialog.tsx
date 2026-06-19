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

type FreemiusProduct = {
  id: string;
  title: string;
  slug: string;
  sandbox: boolean;
};

type FreemiusConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function FreemiusConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: FreemiusConnectDialogProps) {
  const [productId, setProductId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [product, setProduct] = useState<FreemiusProduct | null>(null);
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setProductId("");
    setApiToken("");
    setProduct(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidate() {
    if (!productId.trim()) {
      setError("Saisissez l'identifiant produit Freemius.");
      return;
    }
    if (!apiToken.trim()) {
      setError("Collez votre Bearer Token Freemius.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/freemius/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          productId: productId.trim(),
          apiToken: apiToken.trim(),
        }),
      });
      const data = (await res.json()) as {
        product?: FreemiusProduct;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      if (!data.product) {
        throw new Error("Produit Freemius introuvable.");
      }

      setProduct(data.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect() {
    if (!product) {
      setError("Validez d'abord vos identifiants Freemius.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        productId: product.id,
        apiToken: apiToken.trim(),
        productTitle: product.title,
        sandbox: product.sandbox,
      });
      resetForm();
      onOpenChange(false);
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
          <DialogTitle>Connecter Freemius</DialogTitle>
          <DialogDescription>
            Bearer Token produit depuis Settings → API Token. Le token est limité à un produit
            Freemius.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fs-product-id">ID produit</Label>
            <input
              id="fs-product-id"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setProduct(null);
              }}
              placeholder="Ex. 12345"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fs-api-token">Bearer Token</Label>
            <input
              id="fs-api-token"
              type="password"
              autoComplete="off"
              value={apiToken}
              onChange={(e) => {
                setApiToken(e.target.value);
                setProduct(null);
              }}
              placeholder="Collez votre Bearer Token Freemius"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>

          {product ? (
            <p className="text-sm text-muted-foreground">
              Produit : <span className="font-medium text-foreground">{product.title}</span>
              {product.sandbox ? " (sandbox)" : ""}
            </p>
          ) : null}

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Prérequis</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Produit Freemius avec abonnements actifs</li>
              <li>Bearer Token généré pour ce produit uniquement</li>
              <li>ID produit visible dans l’URL du Developer Dashboard</li>
            </ul>
            <a
              href="https://dashboard.freemius.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
            >
              Ouvrir Freemius Developer Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {!product ? (
            <Button className="w-full" onClick={() => void handleValidate()} disabled={validating}>
              <KeyRound className="h-4 w-4" />
              {validating ? "Validation…" : "Valider"}
            </Button>
          ) : (
            <Button className="w-full" onClick={() => void handleConnect()} disabled={connecting}>
              {connecting ? "Connexion…" : "Connecter"}
            </Button>
          )}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
