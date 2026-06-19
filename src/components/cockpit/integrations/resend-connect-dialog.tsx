"use client";

import { useState } from "react";
import { Copy, ExternalLink, KeyRound } from "lucide-react";
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

type ResendSegment = {
  id: string;
  name: string;
};

type ResendConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

const WEBHOOK_EVENTS = ["email.clicked", "contact.created (optionnel)"];

export function ResendConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: ResendConnectDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [apiKey, setApiKey] = useState("");
  const [webhookSigningSecret, setWebhookSigningSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [segments, setSegments] = useState<ResendSegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [conversionMode, setConversionMode] = useState<"segment" | "email_clicked">("email_clicked");
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setStep(1);
    setApiKey("");
    setWebhookSigningSecret("");
    setWebhookUrl("");
    setAccountLabel("");
    setSegments([]);
    setSelectedSegmentId("");
    setConversionMode("email_clicked");
    setError(null);
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidateApiKey() {
    if (!apiKey.trim()) {
      setError("Collez votre clé API Resend.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/resend/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, apiKey: apiKey.trim() }),
      });
      const data = (await res.json()) as {
        accountLabel?: string;
        segments?: ResendSegment[];
        webhookUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      setAccountLabel(data.accountLabel ?? "Resend");
      setSegments(data.segments ?? []);
      setWebhookUrl(data.webhookUrl ?? "");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleCopyWebhookUrl() {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Impossible de copier l'URL. Copiez-la manuellement.");
    }
  }

  function handleWebhookStepContinue() {
    if (!webhookSigningSecret.trim()) {
      setError("Collez le signing secret Resend (whsec_…).");
      return;
    }
    if (!webhookSigningSecret.trim().startsWith("whsec_")) {
      setError("Format de secret invalide. Attendu : whsec_…");
      return;
    }
    setError(null);
    setStep(3);
  }

  async function handleConnect() {
    setConnecting(true);
    setError(null);

    const segmentId = selectedSegmentId.trim() || null;
    const segmentName = segments.find((s) => s.id === segmentId)?.name ?? null;
    const mode: "segment" | "email_clicked" = segmentId ? "segment" : "email_clicked";

    try {
      await onConnect({
        mode: "real",
        apiKey: apiKey.trim(),
        resendApiKey: apiKey.trim(),
        resendWebhookSigningSecret: webhookSigningSecret.trim(),
        resendConversionSegmentId: segmentId,
        resendConversionSegmentName: segmentName,
        resendConversionMode: mode,
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
          <DialogTitle>Connecter Resend</DialogTitle>
          <DialogDescription>
            {step === 1 && "Clé API Resend Full access pour valider votre compte."}
            {step === 2 &&
              "Configurez le webhook Resend pour recevoir les clics email (pas d'historique rétroactif)."}
            {step === 3 &&
              "Associez optionnellement un segment aux conversions du cockpit."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend-api-key">Clé API</Label>
              <input
                id="resend-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="re_…"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Clé <strong>Full access</strong> (pas Sending access seul)</li>
                <li>Contacts Resend pour alimenter les signups</li>
              </ul>
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Créer une clé API
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button className="w-full" onClick={() => void handleValidateApiKey()} disabled={validating}>
              <KeyRound className="h-4 w-4" />
              {validating ? "Validation…" : "Valider la clé"}
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            {accountLabel ? (
              <p className="text-xs text-muted-foreground">Compte Resend : {accountLabel}</p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="resend-webhook-url">URL webhook (à coller dans Resend)</Label>
              <div className="flex gap-2">
                <input
                  id="resend-webhook-url"
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex h-10 min-w-0 flex-1 rounded-lg border border-input bg-muted/40 px-3 text-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyWebhookUrl()}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Copié" : "Copier"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resend-webhook-secret">Signing secret (whsec_…)</Label>
              <input
                id="resend-webhook-secret"
                type="password"
                autoComplete="off"
                value={webhookSigningSecret}
                onChange={(e) => setWebhookSigningSecret(e.target.value)}
                placeholder="whsec_…"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Dans Resend → Webhooks</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Coller l&apos;URL ci-dessus</li>
                <li>Activer : {WEBHOOK_EVENTS.join(", ")}</li>
                <li>Copier le signing secret ici</li>
              </ul>
              <a
                href="https://resend.com/docs/webhooks/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Documentation webhooks
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleWebhookStepContinue}>
                Continuer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Retour
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            {segments.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="resend-conversion-segment">Segment conversion (optionnel)</Label>
                <select
                  id="resend-conversion-segment"
                  value={selectedSegmentId}
                  onChange={(e) => {
                    setSelectedSegmentId(e.target.value);
                    setConversionMode(e.target.value ? "segment" : "email_clicked");
                  }}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Aucun — conversions via clics email (email.clicked)</option>
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun segment détecté. Les conversions seront comptées via les clics email
                (email.clicked).
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Mode conversions :{" "}
              {conversionMode === "segment"
                ? "contacts du segment sélectionné"
                : "clics email uniques par destinataire"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" onClick={() => void handleConnect()} disabled={connecting}>
                {connecting ? "Connexion…" : "Connecter"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={connecting}>
                Retour
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
