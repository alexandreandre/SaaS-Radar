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

type PostHogProject = {
  id: string;
  name: string;
  timezone?: string;
};

type PostHogEvent = {
  name: string;
  lastSeenAt?: string | null;
};

const HOST_PRESETS = [
  { label: "US Cloud", value: "https://us.posthog.com" },
  { label: "EU Cloud", value: "https://eu.posthog.com" },
  { label: "Custom", value: "custom" },
] as const;

type PostHogConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function PostHogConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: PostHogConnectDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [personalApiKey, setPersonalApiKey] = useState("");
  const [hostPreset, setHostPreset] = useState<(typeof HOST_PRESETS)[number]["value"]>(
    "https://us.posthog.com",
  );
  const [customHost, setCustomHost] = useState("");
  const [projects, setProjects] = useState<PostHogProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [events, setEvents] = useState<PostHogEvent[]>([]);
  const [signupEvent, setSignupEvent] = useState("");
  const [activationEvent, setActivationEvent] = useState("");
  const [validating, setValidating] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resolveAppHost(): string {
    if (hostPreset === "custom") {
      return customHost.trim();
    }
    return hostPreset;
  }

  function resetForm() {
    setStep(1);
    setPersonalApiKey("");
    setHostPreset("https://us.posthog.com");
    setCustomHost("");
    setProjects([]);
    setSelectedProjectId("");
    setEvents([]);
    setSignupEvent("");
    setActivationEvent("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidateKey() {
    if (!personalApiKey.trim()) {
      setError("Collez votre Personal API Key PostHog.");
      return;
    }
    const appHost = resolveAppHost();
    if (!appHost) {
      setError("Indiquez l'URL de votre instance PostHog.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/posthog/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          personalApiKey: personalApiKey.trim(),
          appHost,
        }),
      });
      const data = (await res.json()) as {
        projects?: PostHogProject[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      setProjects(data.projects ?? []);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleSelectProject(posthogProjectId: string) {
    if (!posthogProjectId) {
      setError("Sélectionnez un projet PostHog.");
      return;
    }

    setSelectedProjectId(posthogProjectId);
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/posthog/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          personalApiKey: personalApiKey.trim(),
          appHost: resolveAppHost(),
          posthogProjectId,
        }),
      });
      const data = (await res.json()) as {
        events?: PostHogEvent[];
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

  async function handleConnect(
    signup?: string | null,
    activation?: string | null,
  ) {
    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        personalApiKey: personalApiKey.trim(),
        appHost: resolveAppHost(),
        posthogProjectId: selectedProjectId,
        signupEvent: signup ?? null,
        activationEvent: activation ?? null,
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
          <DialogTitle>Connecter PostHog</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Personal API Key et instance PostHog (US, EU ou self-hosted)."
              : step === 2
                ? "Sélectionnez le projet PostHog à synchroniser."
                : "Associez optionnellement des événements signup et activation."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="posthog-api-key">Personal API Key</Label>
              <input
                id="posthog-api-key"
                type="password"
                autoComplete="off"
                value={personalApiKey}
                onChange={(e) => setPersonalApiKey(e.target.value)}
                placeholder="phx_…"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="posthog-host">Instance PostHog</Label>
              <select
                id="posthog-host"
                value={hostPreset}
                onChange={(e) =>
                  setHostPreset(e.target.value as (typeof HOST_PRESETS)[number]["value"])
                }
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {HOST_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                    {preset.value !== "custom" ? ` (${preset.value.replace("https://", "")})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {hostPreset === "custom" ? (
              <div className="space-y-2">
                <Label htmlFor="posthog-custom-host">URL self-hosted</Label>
                <input
                  id="posthog-custom-host"
                  type="url"
                  autoComplete="off"
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  placeholder="https://posthog.example.com"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </div>
            ) : null}
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Scopes : query:read, project:read, event_definition:read</li>
                <li>Accès au projet à synchroniser</li>
                <li>Événements avec person_id pour MAU/DAU fiables (identify côté SDK)</li>
              </ul>
              <a
                href="https://posthog.com/docs/api/personal-api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Créer une Personal API Key
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button className="w-full" onClick={() => void handleValidateKey()} disabled={validating}>
              <KeyRound className="h-4 w-4" />
              {validating ? "Validation…" : "Valider la clé"}
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            {projects.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="posthog-project">Projet PostHog</Label>
                <select
                  id="posthog-project"
                  value={selectedProjectId}
                  onChange={(e) => void handleSelectProject(e.target.value)}
                  disabled={loadingEvents}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choisir un projet…</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} (ID {project.id})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun projet accessible avec cette clé.
              </p>
            )}
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={loadingEvents}>
              Retour
            </Button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            {events.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="posthog-signup-event">Événement signup (optionnel)</Label>
                  <select
                    id="posthog-signup-event"
                    value={signupEvent}
                    onChange={(e) => setSignupEvent(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Aucun — signups restera à 0</option>
                    {events.map((event) => (
                      <option key={event.name} value={event.name}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="posthog-activation-event">Événement activation (optionnel)</Label>
                  <select
                    id="posthog-activation-event"
                    value={activationEvent}
                    onChange={(e) => setActivationEvent(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Aucun — activationRate restera à 0</option>
                    {events.map((event) => (
                      <option key={event.name} value={event.name}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun événement détecté. Les métriques signup/activation resteront à 0.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                onClick={() =>
                  void handleConnect(signupEvent || null, activationEvent || null)
                }
                disabled={connecting}
              >
                {connecting ? "Connexion…" : "Connecter"}
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleConnect(null, null)}
                disabled={connecting}
              >
                Ignorer les événements
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={connecting}>
              Retour
            </Button>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
