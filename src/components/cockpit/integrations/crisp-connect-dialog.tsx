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

const DEFAULT_INSTALL_URL = "https://marketplace.crisp.chat/";

type CrispConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function CrispConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: CrispConnectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [websiteId, setWebsiteId] = useState("");
  const [websiteName, setWebsiteName] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const installUrl =
    process.env.NEXT_PUBLIC_CRISP_INSTALL_URL?.trim() || DEFAULT_INSTALL_URL;

  function resetForm() {
    setStep(1);
    setWebsiteId("");
    setWebsiteName(null);
    setDomain(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidate() {
    if (!websiteId.trim()) {
      setError("Collez votre Website ID Crisp.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/crisp/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          websiteId: websiteId.trim(),
        }),
      });
      const data = (await res.json()) as {
        websiteName?: string;
        domain?: string;
        accountLabel?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      setWebsiteName(data.websiteName ?? data.accountLabel ?? null);
      setDomain(data.domain ?? null);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        crispWebsiteId: websiteId.trim(),
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
          <DialogTitle>Connecter Crisp</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Installez le plugin The Build Road sur votre workspace Crisp, puis indiquez le Website ID."
              : "Confirmez la connexion de ce workspace au cockpit."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>
                  Installez le plugin The Build Road depuis le{" "}
                  <a
                    href={installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Crisp Marketplace
                  </a>
                </li>
                <li>
                  Copiez le Website ID : Settings → Workspace Settings → Setup &amp;
                  Integrations (UUID)
                </li>
                <li>Analytics Crisp recommandé (Essentials+) pour CSAT et temps de réponse</li>
              </ol>
              <a
                href="https://docs.crisp.chat/guides/rest-api/authentication/plugin-token/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Documentation plugin Crisp
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crisp-website-id">Website ID</Label>
              <input
                id="crisp-website-id"
                type="text"
                autoComplete="off"
                value={websiteId}
                onChange={(e) => setWebsiteId(e.target.value)}
                placeholder="33619249-efd8-44fa-9312-9a594a819eae"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              La métrique activeUsers correspond aux visiteurs uniques chatbox par mois (proxy
              Crisp Analytics).
            </p>
            <Button className="w-full" onClick={() => void handleValidate()} disabled={validating}>
              <KeyRound className="h-4 w-4" />
              {validating ? "Validation…" : "Valider le workspace"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{websiteName ?? "Workspace Crisp"}</p>
              {domain ? (
                <p className="mt-1 text-xs text-muted-foreground">{domain}</p>
              ) : null}
              <p className="mt-2 font-mono text-xs text-muted-foreground">{websiteId.trim()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" onClick={() => void handleConnect()} disabled={connecting}>
                {connecting ? "Connexion…" : "Connecter"}
              </Button>
              <Button variant="outline" onClick={() => setStep(1)} disabled={connecting}>
                Retour
              </Button>
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
