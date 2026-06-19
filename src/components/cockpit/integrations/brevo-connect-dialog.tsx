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

type BrevoContactList = {
  id: string;
  name: string;
};

type BrevoConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function BrevoConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: BrevoConnectDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [apiKey, setApiKey] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [lists, setLists] = useState<BrevoContactList[]>([]);
  const [conversionMode, setConversionMode] = useState<"campaign_clicks" | "list_addition">(
    "campaign_clicks",
  );
  const [selectedListId, setSelectedListId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookToken, setWebhookToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setStep(1);
    setApiKey("");
    setCompanyName("");
    setLists([]);
    setConversionMode("campaign_clicks");
    setSelectedListId("");
    setWebhookUrl("");
    setWebhookToken("");
    setError(null);
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidateApiKey() {
    if (!apiKey.trim()) {
      setError("Collez votre clé API Brevo.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/brevo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, apiKey: apiKey.trim() }),
      });
      const data = (await res.json()) as {
        companyName?: string;
        accountLabel?: string;
        lists?: BrevoContactList[];
        webhookUrl?: string;
        webhookToken?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      setCompanyName(data.companyName ?? data.accountLabel ?? "Brevo");
      setLists(data.lists ?? []);
      setWebhookUrl(data.webhookUrl ?? "");
      setWebhookToken(data.webhookToken ?? "");
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

  function handleConversionStepContinue() {
    if (conversionMode === "list_addition" && !selectedListId.trim()) {
      setError("Sélectionnez une liste pour le mode ajout à liste.");
      return;
    }
    setError(null);
    if (conversionMode === "list_addition") {
      setStep(3);
    } else {
      void handleConnect("campaign_clicks", null, null);
    }
  }

  async function handleConnect(
    mode: "campaign_clicks" | "list_addition",
    listId: string | null,
    listName: string | null,
  ) {
    setConnecting(true);
    setError(null);

    try {
      await onConnect({
        mode: "real",
        apiKey: apiKey.trim(),
        brevoApiKey: apiKey.trim(),
        brevoConversionMode: mode,
        brevoConversionListId: listId,
        brevoConversionListName: listName,
        brevoWebhookToken: webhookToken.trim() || undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setConnecting(false);
    }
  }

  const selectedListName = lists.find((l) => l.id === selectedListId)?.name ?? null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Brevo</DialogTitle>
          <DialogDescription>
            {step === 1 && "Clé API Brevo pour synchroniser signups et conversions."}
            {step === 2 && "Choisissez comment mesurer les conversions dans le cockpit."}
            {step === 3 &&
              "Configurez le webhook Brevo pour suivre les ajouts à votre liste cible."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brevo-api-key">Clé API</Label>
              <input
                id="brevo-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="xkeysib-…"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Clé restreinte : Contacts (lecture) + Campagnes email (lecture)</li>
                <li>Historique signups sur 12 mois via l&apos;API contacts</li>
              </ul>
              <a
                href="https://app.brevo.com/settings/keys/api"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Générer une clé API
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
            {companyName ? (
              <p className="text-xs text-muted-foreground">Compte Brevo : {companyName}</p>
            ) : null}
            <div className="space-y-2">
              <Label>Mode conversions</Label>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
                  <input
                    type="radio"
                    name="brevo-conversion-mode"
                    checked={conversionMode === "campaign_clicks"}
                    onChange={() => {
                      setConversionMode("campaign_clicks");
                      setSelectedListId("");
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium">Clics campagnes email</span>
                    <span className="text-xs text-muted-foreground">
                      Somme des clics uniques par mois d&apos;envoi (100 % API, recommandé).
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
                  <input
                    type="radio"
                    name="brevo-conversion-mode"
                    checked={conversionMode === "list_addition"}
                    onChange={() => setConversionMode("list_addition")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium">Ajouts à une liste</span>
                    <span className="text-xs text-muted-foreground">
                      Webhook marketing requis — contacts uniques ajoutés à une liste cible.
                    </span>
                  </span>
                </label>
              </div>
            </div>
            {conversionMode === "list_addition" ? (
              lists.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="brevo-conversion-list">Liste cible</Label>
                  <select
                    id="brevo-conversion-list"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Sélectionnez une liste…</option>
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-destructive">
                  Aucune liste détectée. Créez une liste dans Brevo ou utilisez le mode campagnes.
                </p>
              )
            ) : null}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleConversionStepContinue}
                disabled={connecting || (conversionMode === "list_addition" && lists.length === 0)}
              >
                {connecting
                  ? "Connexion…"
                  : conversionMode === "campaign_clicks"
                    ? "Connecter"
                    : "Configurer le webhook"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Retour
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brevo-webhook-url">URL webhook (à coller dans Brevo)</Label>
              <div className="flex gap-2">
                <input
                  id="brevo-webhook-url"
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
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Dans Brevo → Intégrations → Webhooks</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Webhook sortant (outbound)</li>
                <li>Événement : Contact added to list (list_addition)</li>
                <li>Coller l&apos;URL ci-dessus (le token est inclus)</li>
              </ul>
              <a
                href="https://developers.brevo.com/docs/marketing-webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Documentation webhooks
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Liste cible : {selectedListName ?? selectedListId}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                onClick={() =>
                  void handleConnect("list_addition", selectedListId || null, selectedListName)
                }
                disabled={connecting}
              >
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
