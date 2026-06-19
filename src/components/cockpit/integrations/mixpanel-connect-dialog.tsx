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

type MixpanelEvent = {
  name: string;
};

const REGION_PRESETS = [
  { label: "US", value: "us" },
  { label: "EU", value: "eu" },
  { label: "IN", value: "in" },
] as const;

type MixpanelConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function MixpanelConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: MixpanelConnectDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serviceAccountUsername, setServiceAccountUsername] = useState("");
  const [serviceAccountSecret, setServiceAccountSecret] = useState("");
  const [region, setRegion] = useState<(typeof REGION_PRESETS)[number]["value"]>("us");
  const [mixpanelProjectId, setMixpanelProjectId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [events, setEvents] = useState<MixpanelEvent[]>([]);
  const [activityEvent, setActivityEvent] = useState("");
  const [signupEvent, setSignupEvent] = useState("");
  const [activationEvent, setActivationEvent] = useState("");
  const [validating, setValidating] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setStep(1);
    setServiceAccountUsername("");
    setServiceAccountSecret("");
    setRegion("us");
    setMixpanelProjectId("");
    setWorkspaceId("");
    setEvents([]);
    setActivityEvent("");
    setSignupEvent("");
    setActivationEvent("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidateCredentials() {
    if (!serviceAccountUsername.trim() || !serviceAccountSecret.trim()) {
      setError("Renseignez le username et le secret du Service Account Mixpanel.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/mixpanel/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          serviceAccountUsername: serviceAccountUsername.trim(),
          serviceAccountSecret: serviceAccountSecret.trim(),
          region,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleLoadEvents() {
    if (!mixpanelProjectId.trim()) {
      setError("Indiquez le Project ID Mixpanel.");
      return;
    }

    setLoadingEvents(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/mixpanel/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          serviceAccountUsername: serviceAccountUsername.trim(),
          serviceAccountSecret: serviceAccountSecret.trim(),
          region,
          mixpanelProjectId: mixpanelProjectId.trim(),
          workspaceId: workspaceId.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        events?: MixpanelEvent[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Chargement des événements échoué");
      }

      setEvents(data.events ?? []);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement des événements échoué");
    } finally {
      setLoadingEvents(false);
    }
  }

  async function handleConnect() {
    const resolvedActivity = activityEvent.trim() || signupEvent.trim();
    if (!resolvedActivity) {
      setError("Sélectionnez un événement activité ou signup pour MAU/DAU.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        mixpanelServiceAccountUsername: serviceAccountUsername.trim(),
        mixpanelServiceAccountSecret: serviceAccountSecret.trim(),
        mixpanelProjectId: mixpanelProjectId.trim(),
        mixpanelRegion: region,
        mixpanelWorkspaceId: workspaceId.trim() || null,
        activityEvent: resolvedActivity,
        signupEvent: signupEvent.trim() || null,
        activationEvent: activationEvent.trim() || null,
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setConnecting(false);
    }
  }

  const eventOptions =
    events.length > 0
      ? events
      : activityEvent || signupEvent || activationEvent
        ? [
            ...(activityEvent ? [{ name: activityEvent }] : []),
            ...(signupEvent ? [{ name: signupEvent }] : []),
            ...(activationEvent ? [{ name: activationEvent }] : []),
          ]
        : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Mixpanel</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Service Account Mixpanel et région du projet (US, EU ou IN)."
              : step === 2
                ? "Project ID depuis l'URL Mixpanel (mixpanel.com/project/…)."
                : "Associez les événements activité, signup et activation."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mixpanel-sa-username">Username Service Account</Label>
              <input
                id="mixpanel-sa-username"
                type="text"
                autoComplete="off"
                value={serviceAccountUsername}
                onChange={(e) => setServiceAccountUsername(e.target.value)}
                placeholder="saas-radar.abc123"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mixpanel-sa-secret">Secret Service Account</Label>
              <input
                id="mixpanel-sa-secret"
                type="password"
                autoComplete="off"
                value={serviceAccountSecret}
                onChange={(e) => setServiceAccountSecret(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mixpanel-region">Région</Label>
              <select
                id="mixpanel-region"
                value={region}
                onChange={(e) =>
                  setRegion(e.target.value as (typeof REGION_PRESETS)[number]["value"])
                }
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {REGION_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Service Account avec rôle Analyst ou Admin sur le projet</li>
                <li>Plan Growth ou Enterprise pour la Query API (MAU, rétention)</li>
                <li>Export API pour la feature la plus utilisée</li>
              </ul>
              <a
                href="https://docs.mixpanel.com/docs/admin/organizations-and-projects/service-accounts"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Créer un Service Account
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button
              className="w-full"
              onClick={() => void handleValidateCredentials()}
              disabled={validating}
            >
              <KeyRound className="h-4 w-4" />
              {validating ? "Validation…" : "Valider les identifiants"}
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mixpanel-project-id">Project ID Mixpanel</Label>
              <input
                id="mixpanel-project-id"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={mixpanelProjectId}
                onChange={(e) => setMixpanelProjectId(e.target.value)}
                placeholder="1234567"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mixpanel-workspace-id">Workspace ID (optionnel)</Label>
              <input
                id="mixpanel-workspace-id"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                placeholder="Data Views uniquement"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                onClick={() => void handleLoadEvents()}
                disabled={loadingEvents}
              >
                {loadingEvents ? "Chargement…" : "Continuer"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={loadingEvents}>
                Retour
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mixpanel-activity-event">Événement activité (MAU/DAU)</Label>
              {eventOptions.length > 0 ? (
                <select
                  id="mixpanel-activity-event"
                  value={activityEvent}
                  onChange={(e) => setActivityEvent(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choisir…</option>
                  {eventOptions.map((event) => (
                    <option key={event.name} value={event.name}>
                      {event.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="mixpanel-activity-event"
                  type="text"
                  autoComplete="off"
                  value={activityEvent}
                  onChange={(e) => setActivityEvent(e.target.value)}
                  placeholder="Logged In"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mixpanel-signup-event">Événement signup (optionnel)</Label>
              {eventOptions.length > 0 ? (
                <select
                  id="mixpanel-signup-event"
                  value={signupEvent}
                  onChange={(e) => setSignupEvent(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Aucun</option>
                  {eventOptions.map((event) => (
                    <option key={`signup-${event.name}`} value={event.name}>
                      {event.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="mixpanel-signup-event"
                  type="text"
                  autoComplete="off"
                  value={signupEvent}
                  onChange={(e) => setSignupEvent(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mixpanel-activation-event">Événement activation (optionnel)</Label>
              {eventOptions.length > 0 ? (
                <select
                  id="mixpanel-activation-event"
                  value={activationEvent}
                  onChange={(e) => setActivationEvent(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Aucun</option>
                  {eventOptions.map((event) => (
                    <option key={`activation-${event.name}`} value={event.name}>
                      {event.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="mixpanel-activation-event"
                  type="text"
                  autoComplete="off"
                  value={activationEvent}
                  onChange={(e) => setActivationEvent(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              )}
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Lexicon vide — saisissez les noms d&apos;événements manuellement (sensible à la casse).
              </p>
            ) : null}
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
