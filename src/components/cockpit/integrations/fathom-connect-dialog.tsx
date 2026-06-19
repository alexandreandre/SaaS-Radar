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

type FathomSite = {
  id: string;
  name: string;
  timezone?: string;
};

type FathomEvent = {
  id: string;
  name: string;
};

type FathomConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function FathomConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: FathomConnectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKey, setApiKey] = useState("");
  const [sites, setSites] = useState<FathomSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [events, setEvents] = useState<FathomEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [timezone, setTimezone] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setStep(1);
    setApiKey("");
    setSites([]);
    setSelectedSiteId("");
    setEvents([]);
    setSelectedEventId("");
    setTimezone(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidateKey() {
    if (!apiKey.trim()) {
      setError("Collez votre clé API Fathom.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/fathom/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, apiKey: apiKey.trim() }),
      });
      const data = (await res.json()) as {
        sites?: FathomSite[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      const list = data.sites ?? [];
      if (list.length === 0) {
        throw new Error("Aucun site accessible avec cette clé API.");
      }

      setSites(list);
      setSelectedSiteId(list[0]!.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleValidateSite() {
    if (!selectedSiteId) {
      setError("Sélectionnez un site Fathom.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/fathom/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          apiKey: apiKey.trim(),
          siteId: selectedSiteId,
        }),
      });
      const data = (await res.json()) as {
        events?: FathomEvent[];
        timezone?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      setEvents(data.events ?? []);
      setTimezone(data.timezone ?? null);
      setSelectedEventId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect(signupEventId?: string | null, signupEventName?: string | null) {
    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        apiKey: apiKey.trim(),
        siteId: selectedSiteId,
        signupEvent: signupEventId ?? null,
        signupEventName: signupEventName ?? null,
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setConnecting(false);
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Fathom</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Clé API Fathom (lecture seule recommandée). Chaque appel API consomme votre quota de pageviews."
              : "Choisissez le site à synchroniser et, optionnellement, un événement pour les signups."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fathom-api-key">Clé API</Label>
              <input
                id="fathom-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Collez votre clé API Fathom"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Compte Fathom Analytics actif</li>
                <li>Token lecture seule ou accès au site cible</li>
                <li>Les requêtes API comptent dans votre quota mensuel</li>
              </ul>
              <a
                href="https://app.usefathom.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Créer une clé API
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button className="w-full" onClick={() => void handleValidateKey()} disabled={validating}>
              <KeyRound className="h-4 w-4" />
              {validating ? "Validation…" : "Valider la clé"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fathom-site">Site</Label>
              <select
                id="fathom-site"
                value={selectedSiteId}
                onChange={(e) => {
                  setSelectedSiteId(e.target.value);
                  setEvents([]);
                  setSelectedEventId("");
                }}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.id})
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void handleValidateSite()}
              disabled={validating || !selectedSiteId}
            >
              {validating ? "Chargement des événements…" : "Charger les événements du site"}
            </Button>
            {timezone ? (
              <p className="text-xs text-muted-foreground">Fuseau du site : {timezone}</p>
            ) : null}
            {events.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="fathom-signup-event">Événement signup (optionnel)</Label>
                <select
                  id="fathom-signup-event"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Aucun — signups restera à 0</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({event.id})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chargez les événements pour mapper les signups, ou connectez sans événement.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                onClick={() =>
                  void handleConnect(
                    selectedEventId || null,
                    selectedEvent?.name ?? null,
                  )
                }
                disabled={connecting || !selectedSiteId}
              >
                {connecting ? "Connexion…" : "Connecter"}
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleConnect(null, null)}
                disabled={connecting || !selectedSiteId}
              >
                Ignorer les signups
              </Button>
            </div>
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
