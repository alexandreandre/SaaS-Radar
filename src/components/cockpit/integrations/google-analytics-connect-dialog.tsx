"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
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

type GaProperty = {
  propertyId: string;
  displayName: string;
  accountDisplayName: string;
};

type GaEvent = {
  name: string;
  count: number;
};

type GoogleAnalyticsConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function GoogleAnalyticsConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: GoogleAnalyticsConnectDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [properties, setProperties] = useState<GaProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [events, setEvents] = useState<GaEvent[]>([]);
  const [signupEvent, setSignupEvent] = useState("sign_up");
  const [trialEvent, setTrialEvent] = useState("");
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthDone, setOauthDone] = useState(false);

  const selectedProperty = properties.find((p) => p.propertyId === selectedPropertyId);

  function resetForm() {
    setStep(1);
    setProperties([]);
    setSelectedPropertyId("");
    setEvents([]);
    setSignupEvent("sign_up");
    setTrialEvent("");
    setError(null);
    setOauthDone(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  const loadProperties = useCallback(async () => {
    setLoadingProperties(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connectors/google-analytics/properties?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json()) as {
        properties?: GaProperty[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger les propriétés GA4");
      }
      const list = data.properties ?? [];
      setProperties(list);
      if (list.length === 1) {
        setSelectedPropertyId(list[0]!.propertyId);
      }
      setOauthDone(true);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des propriétés");
    } finally {
      setLoadingProperties(false);
    }
  }, [projectId]);

  const loadEvents = useCallback(async () => {
    if (!selectedPropertyId) return;
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connectors/google-analytics/events?projectId=${encodeURIComponent(projectId)}&propertyId=${encodeURIComponent(selectedPropertyId)}`,
      );
      const data = (await res.json()) as {
        events?: GaEvent[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger les événements GA4");
      }
      const list = data.events ?? [];
      setEvents(list);
      if (list.some((event) => event.name === "sign_up")) {
        setSignupEvent("sign_up");
      } else if (list.length > 0) {
        setSignupEvent(list[0]!.name);
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des événements");
    } finally {
      setLoadingEvents(false);
    }
  }, [projectId, selectedPropertyId]);

  useEffect(() => {
    if (!open) return;

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("google_analytics_oauth");
    if (oauthStatus === "1") {
      setOauthDone(true);
      void loadProperties();
      params.delete("google_analytics_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "token_error") {
      setError("Échange OAuth échoué. Réessayez ou vérifiez la configuration serveur.");
      params.delete("google_analytics_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "encryption_error") {
      setError("Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY).");
      params.delete("google_analytics_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [open, loadProperties]);

  function startOAuth() {
    window.location.href = `/api/connectors/google-analytics/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  async function handleConnect() {
    if (!selectedPropertyId) {
      setError("Sélectionnez une propriété GA4.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        gaPropertyId: selectedPropertyId,
        propertyDisplayName: selectedProperty?.displayName,
        signupEvent: signupEvent.trim() || "sign_up",
        trialEvent: trialEvent.trim() || null,
      });
      handleOpenChange(false);
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
          <DialogTitle>Connecter Google Analytics</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;accès GA4, choisissez une propriété et mappez vos événements de
            conversion. Métriques : utilisateurs actifs, signups et trials sur 12 mois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && !oauthDone ? (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Prérequis</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Propriété GA4 (Universal Analytics non pris en charge)</li>
                  <li>Scope OAuth : analytics.readonly</li>
                  <li>APIs Data + Admin activées dans Google Cloud</li>
                </ul>
                <a
                  href="https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Documentation GA4 Data API
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button className="w-full" onClick={startOAuth}>
                Continuer avec Google
              </Button>
            </>
          ) : null}

          {step === 2 || (oauthDone && step < 3) ? (
            <>
              {loadingProperties ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des propriétés GA4…
                </div>
              ) : properties.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="ga-property">Propriété GA4</Label>
                  <select
                    id="ga-property"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Sélectionner une propriété…</option>
                    {properties.map((property) => (
                      <option key={property.propertyId} value={property.propertyId}>
                        {property.displayName} · {property.accountDisplayName} ·{" "}
                        {property.propertyId}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune propriété GA4 accessible. Vérifiez les permissions ou réautorisez
                  l&apos;accès.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  onClick={() => void loadEvents()}
                  disabled={loadingEvents || loadingProperties || !selectedPropertyId}
                >
                  {loadingEvents ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des événements…
                    </>
                  ) : (
                    "Continuer"
                  )}
                </Button>
                <Button variant="outline" onClick={startOAuth} disabled={loadingEvents}>
                  Changer de compte Google
                </Button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Propriété :{" "}
                <span className="font-medium text-foreground">
                  {selectedProperty?.displayName ?? selectedPropertyId}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ga-signup-event">Événement signups</Label>
                <select
                  id="ga-signup-event"
                  value={signupEvent}
                  onChange={(e) => setSignupEvent(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {events.length === 0 ? (
                    <option value="sign_up">sign_up (recommandé GA4)</option>
                  ) : (
                    events.map((event) => (
                      <option key={event.name} value={event.name}>
                        {event.name} ({event.count.toLocaleString("fr-FR")} events / 30j)
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-muted-foreground">
                  Par défaut :{" "}
                  <a
                    href="https://developers.google.com/analytics/devguides/collection/ga4/reference/events#sign_up"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    sign_up
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ga-trial-event">Événement trials (optionnel)</Label>
                <select
                  id="ga-trial-event"
                  value={trialEvent}
                  onChange={(e) => setTrialEvent(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Aucun — trials = 0</option>
                  {events.map((event) => (
                    <option key={`trial-${event.name}`} value={event.name}>
                      {event.name} ({event.count.toLocaleString("fr-FR")} events / 30j)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  onClick={() => void handleConnect()}
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Synchronisation…
                    </>
                  ) : (
                    "Connecter cette propriété"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setStep(2)} disabled={connecting}>
                  Retour
                </Button>
              </div>
            </>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
