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

type GoogleAdsAccount = {
  customerId: string;
  descriptiveName: string;
  currencyCode?: string;
};

type GoogleAdsConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function GoogleAdsConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: GoogleAdsConnectDialogProps) {
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthDone, setOauthDone] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connectors/google-ads/accounts?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json()) as {
        accounts?: GoogleAdsAccount[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger les comptes Google Ads");
      }
      const list = data.accounts ?? [];
      setAccounts(list);
      if (list.length === 1) {
        setSelectedCustomerId(list[0]!.customerId);
      }
      setOauthDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des comptes");
    } finally {
      setLoadingAccounts(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSelectedCustomerId("");
      setOauthDone(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("google_ads_oauth");
    if (oauthStatus === "1") {
      setOauthDone(true);
      void loadAccounts();
      params.delete("google_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "token_error") {
      setError("Échange OAuth échoué. Réessayez ou vérifiez la configuration serveur.");
      params.delete("google_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "encryption_error") {
      setError("Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY).");
      params.delete("google_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [open, loadAccounts]);

  function startOAuth() {
    window.location.href = `/api/connectors/google-ads/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  async function handleConnect() {
    if (!selectedCustomerId) {
      setError("Sélectionnez un compte Google Ads.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({ mode: "real", customerId: selectedCustomerId });
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
          <DialogTitle>Connecter Google Ads</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;accès à vos campagnes, puis choisissez le compte à synchroniser.
            Métriques : budget, impressions, clics et conversions sur 12 mois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!oauthDone ? (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Prérequis</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Compte Google Ads actif</li>
                  <li>Scope OAuth : accès Google Ads (adwords)</li>
                  <li>Developer token configuré côté plateforme</li>
                </ul>
                <a
                  href="https://ads.google.com/aw/apicenter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  API Center Google Ads
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button className="w-full" onClick={startOAuth}>
                Continuer avec Google
              </Button>
            </>
              ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Vos données déjà synchronisées restent visibles dans le cockpit pendant que
                vous reconnectez Google Ads.
              </div>
              {loadingAccounts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des comptes accessibles…
                </div>
              ) : accounts.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="google-ads-account">Compte Google Ads</Label>
                  <select
                    id="google-ads-account"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Sélectionner un compte…</option>
                    {accounts.map((account) => (
                      <option key={account.customerId} value={account.customerId}>
                        {account.descriptiveName}
                        {account.currencyCode ? ` (${account.currencyCode})` : ""} ·{" "}
                        {account.customerId}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun compte accessible. Vérifiez les permissions OAuth ou réautorisez l&apos;accès.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  onClick={() => void handleConnect()}
                  disabled={connecting || loadingAccounts || !selectedCustomerId}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Synchronisation…
                    </>
                  ) : (
                    "Connecter ce compte"
                  )}
                </Button>
                <Button variant="outline" onClick={startOAuth} disabled={connecting}>
                  Changer de compte Google
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
