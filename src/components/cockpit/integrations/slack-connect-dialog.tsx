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

type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
};

type SlackConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function SlackConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: SlackConnectDialogProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthDone, setOauthDone] = useState(false);

  const loadChannels = useCallback(async () => {
    setLoadingChannels(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connectors/slack/channels?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json()) as {
        channels?: SlackChannel[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger les canaux Slack");
      }
      const list = data.channels ?? [];
      setChannels(list);
      if (list.length === 1) {
        setSelectedChannelId(list[0]!.id);
      }
      setOauthDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des canaux");
    } finally {
      setLoadingChannels(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSelectedChannelId("");
      setOauthDone(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("slack_oauth");

    if (oauthStatus === "1") {
      setOauthDone(true);
      void loadChannels();
      params.delete("slack_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "token_error") {
      setError("Échange OAuth échoué. Réessayez ou vérifiez la configuration serveur.");
      params.delete("slack_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "encryption_error") {
      setError("Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY).");
      params.delete("slack_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [open, loadChannels]);

  function startOAuth() {
    window.location.href = `/api/connectors/slack/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  async function handleConnect() {
    if (!selectedChannelId) {
      setError("Sélectionnez un canal Slack.");
      return;
    }

    const selected = channels.find((c) => c.id === selectedChannelId);

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        channelId: selectedChannelId,
        channelName: selected?.name,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connecter Slack</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;accès à votre workspace, puis choisissez le canal qui recevra les
            alertes cockpit (MRR, churn, ROAS, intégrations).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!oauthDone ? (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Prérequis</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Workspace Slack actif</li>
                  <li>Scopes bot : chat:write, channels:read, groups:read</li>
                  <li>Canal public ou privé (invitez le bot si privé)</li>
                </ul>
                <a
                  href="https://api.slack.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Slack API Apps
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button className="w-full" onClick={startOAuth}>
                Continuer avec Slack
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Les alertes seront publiées dans le canal choisi. Pour un canal privé, invitez le
                bot avec <span className="font-mono">/invite @The-Build-Road</span>.
              </div>
              {loadingChannels ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des canaux accessibles…
                </div>
              ) : channels.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="slack-channel">Canal d&apos;alertes</Label>
                  <select
                    id="slack-channel"
                    value={selectedChannelId}
                    onChange={(e) => setSelectedChannelId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Sélectionner un canal…</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                        {channel.isPrivate ? " (privé)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun canal accessible. Réautorisez l&apos;app ou vérifiez les permissions OAuth.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  onClick={() => void handleConnect()}
                  disabled={connecting || loadingChannels || !selectedChannelId}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connexion…
                    </>
                  ) : (
                    "Connecter ce canal"
                  )}
                </Button>
                <Button variant="outline" onClick={startOAuth} disabled={connecting}>
                  Changer de workspace
                </Button>
              </div>
            </>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
