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
import { Badge } from "@/components/ui/badge";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";

type BetterStackMonitor = {
  id: string;
  name: string;
  url: string | null;
  status: string;
  teamName: string | null;
};

type BetterStackConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

function statusLabel(status: string): string {
  switch (status) {
    case "up":
      return "En ligne";
    case "down":
      return "Hors ligne";
    case "paused":
      return "En pause";
    case "maintenance":
      return "Maintenance";
    case "validating":
      return "Reprise";
    case "pending":
      return "En attente";
    default:
      return status;
  }
}

export function BetterStackConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: BetterStackConnectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [apiToken, setApiToken] = useState("");
  const [monitors, setMonitors] = useState<BetterStackMonitor[]>([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState("");
  const [suggestedMonitorId, setSuggestedMonitorId] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setStep(1);
    setApiToken("");
    setMonitors([]);
    setSelectedMonitorId("");
    setSuggestedMonitorId(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleValidateToken() {
    if (!apiToken.trim()) {
      setError("Collez votre token API Better Stack Uptime.");
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/connectors/better-stack/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, apiToken: apiToken.trim() }),
      });
      const data = (await res.json()) as {
        monitors?: BetterStackMonitor[];
        suggestedMonitorId?: string | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation échouée");
      }

      const list = data.monitors ?? [];
      if (list.length === 0) {
        throw new Error(
          "Aucun monitor Uptime trouvé. Créez un monitor dans Better Stack puis réessayez.",
        );
      }

      const suggested = data.suggestedMonitorId ?? null;
      setMonitors(list);
      setSuggestedMonitorId(suggested);
      setSelectedMonitorId(suggested ?? list[0]!.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation échouée");
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect() {
    if (!selectedMonitorId) {
      setError("Sélectionnez un monitor Uptime.");
      return;
    }

    const selected = monitors.find((monitor) => monitor.id === selectedMonitorId);

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        betterStackApiToken: apiToken.trim(),
        betterStackMonitorId: selectedMonitorId,
        betterStackMonitorName: selected?.name ?? null,
        betterStackMonitorUrl: selected?.url ?? null,
        betterStackTeamName: selected?.teamName ?? null,
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
          <DialogTitle>Connecter Better Stack</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Token API Uptime Better Stack (lecture monitors et incidents)."
              : "Choisissez le monitor de production à suivre dans le cockpit."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="better-stack-api-token">Token API Uptime</Label>
              <input
                id="better-stack-api-token"
                type="password"
                autoComplete="off"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Collez votre token API Better Stack"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prérequis</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Compte Better Stack avec au moins un monitor Uptime</li>
                <li>Token Uptime team-scoped ou Global API token</li>
                <li>Accès lecture aux monitors et incidents</li>
              </ul>
              <a
                href="https://betterstack.com/docs/uptime/api/getting-started-with-uptime-api/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Créer un token API
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button className="w-full" onClick={() => void handleValidateToken()} disabled={validating}>
              <KeyRound className="h-4 w-4" />
              {validating ? "Validation…" : "Vérifier le token"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="better-stack-monitor">Monitor Uptime</Label>
              <select
                id="better-stack-monitor"
                value={selectedMonitorId}
                onChange={(e) => setSelectedMonitorId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {monitors.map((monitor) => (
                  <option key={monitor.id} value={monitor.id}>
                    {monitor.name}
                    {monitor.url ? ` — ${monitor.url}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedMonitorId ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                {(() => {
                  const monitor = monitors.find((item) => item.id === selectedMonitorId);
                  if (!monitor) return null;
                  return (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{monitor.name}</span>
                        <Badge variant="outline">{statusLabel(monitor.status)}</Badge>
                        {suggestedMonitorId === monitor.id ? (
                          <Badge variant="secondary">Suggéré</Badge>
                        ) : null}
                      </div>
                      {monitor.url ? (
                        <p className="text-xs text-muted-foreground break-all">{monitor.url}</p>
                      ) : null}
                      {monitor.teamName ? (
                        <p className="text-xs text-muted-foreground">Équipe : {monitor.teamName}</p>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
            ) : null}

            <Button className="w-full" onClick={() => void handleConnect()} disabled={connecting}>
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
