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

type PlausibleGoal = {
  id: string;
  displayName: string;
  goalType: string;
};

type PlausibleConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function PlausibleConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: PlausibleConnectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKey, setApiKey] = useState("");
  const [siteId, setSiteId] = useState("");
  const [goals, setGoals] = useState<PlausibleGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [timezone, setTimezone] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setStep(1);
    setApiKey("");
    setSiteId("");
    setGoals([]);
    setSelectedGoal("");
    setTimezone(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidate() {
    if (!apiKey.trim()) {
      setError("Collez votre clé Stats API Plausible.");
      return;
    }
    if (!siteId.trim()) {
      setError("Indiquez le domaine du site tel qu'enregistré dans Plausible.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/plausible/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          apiKey: apiKey.trim(),
          siteId: siteId.trim(),
        }),
      });
      const data = (await res.json()) as {
        goals?: PlausibleGoal[];
        timezone?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      setGoals(data.goals ?? []);
      setTimezone(data.timezone ?? null);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect(signupGoalDisplayName?: string | null) {
    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        apiKey: apiKey.trim(),
        siteId: siteId.trim(),
        signupGoalDisplayName: signupGoalDisplayName ?? null,
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
          <DialogTitle>Connecter Plausible</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Clé Stats API (plan Business) et domaine du site. Accès lecture seule."
              : "Associez optionnellement un goal Plausible à la métrique signups du cockpit."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plausible-api-key">Clé Stats API</Label>
              <input
                id="plausible-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Collez votre clé Stats API"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plausible-site-id">Domaine du site</Label>
              <input
                id="plausible-site-id"
                type="text"
                autoComplete="off"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="app.example.com"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Plan Business Plausible (Stats API)</li>
                <li>Clé de type Stats API, scope lecture seule</li>
                <li>Domaine identique à celui configuré dans Plausible</li>
              </ul>
              <a
                href="https://plausible.io/docs/stats-api#authentication"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Créer une clé Stats API
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
            {timezone ? (
              <p className="text-xs text-muted-foreground">Fuseau du site : {timezone}</p>
            ) : null}
            {goals.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="plausible-signup-goal">Goal signup (optionnel)</Label>
                <select
                  id="plausible-signup-goal"
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Aucun — signups restera à 0</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.displayName}>
                      {goal.displayName} ({goal.goalType})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun goal détecté. Les signups resteront à 0 jusqu&apos;à configuration d&apos;un
                goal dans Plausible.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                onClick={() => void handleConnect(selectedGoal || null)}
                disabled={connecting}
              >
                {connecting ? "Connexion…" : "Connecter"}
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleConnect(null)}
                disabled={connecting}
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
