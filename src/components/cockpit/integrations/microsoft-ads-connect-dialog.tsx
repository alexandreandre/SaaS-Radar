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

type MicrosoftAdsAccount = {
  accountId: string;
  customerId: string;
  name: string;
  currencyCode?: string;
  accountNumber?: string;
};

type MicrosoftAdsConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function MicrosoftAdsConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: MicrosoftAdsConnectDialogProps) {
  const [accounts, setAccounts] = useState<MicrosoftAdsAccount[]>([]);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthDone, setOauthDone] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connectors/microsoft-ads/accounts?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json()) as {
        accounts?: MicrosoftAdsAccount[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger les comptes Microsoft Ads");
      }
      const list = data.accounts ?? [];
      setAccounts(list);
      if (list.length === 1) {
        setSelectedAccountKey(`${list[0]!.customerId}:${list[0]!.accountId}`);
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
      setSelectedAccountKey("");
      setOauthDone(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("microsoft_ads_oauth");
    if (oauthStatus === "1") {
      setOauthDone(true);
      void loadAccounts();
      params.delete("microsoft_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "token_error") {
      setError("Échange OAuth échoué. Réessayez ou vérifiez la configuration serveur.");
      params.delete("microsoft_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "encryption_error") {
      setError("Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY).");
      params.delete("microsoft_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [open, loadAccounts]);

  function startOAuth(provider: "microsoft" | "google") {
    window.location.href = `/api/connectors/microsoft-ads/oauth?projectId=${encodeURIComponent(projectId)}&provider=${provider}`;
  }

  const selectedAccount = accounts.find(
    (account) => `${account.customerId}:${account.accountId}` === selectedAccountKey,
  );

  async function handleConnect() {
    if (!selectedAccount) {
      setError("Sélectionnez un compte Microsoft Ads.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({
        mode: "real",
        accountId: selectedAccount.accountId,
        customerId: selectedAccount.customerId,
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
          <DialogTitle>Connecter Microsoft Ads</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;accès à vos campagnes Bing, puis choisissez le compte à synchroniser.
            Métriques : budget, impressions, clics et conversions sur 12 mois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!oauthDone ? (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Prérequis</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Compte Microsoft Advertising actif</li>
                  <li>Developer token configuré côté plateforme</li>
                  <li>Connexion via Microsoft ou Google (compte lié)</li>
                </ul>
                <a
                  href="https://learn.microsoft.com/en-us/advertising/guides/get-started?view=bingads-13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Documentation Microsoft Advertising API
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => startOAuth("microsoft")}>
                  Continuer avec Microsoft
                </Button>
                <Button variant="outline" className="w-full" onClick={() => startOAuth("google")}>
                  Continuer avec Google
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Vos données déjà synchronisées restent visibles dans le cockpit pendant que
                vous reconnectez Microsoft Ads.
              </div>
              {loadingAccounts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des comptes accessibles…
                </div>
              ) : accounts.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="microsoft-ads-account">Compte Microsoft Ads</Label>
                  <select
                    id="microsoft-ads-account"
                    value={selectedAccountKey}
                    onChange={(e) => setSelectedAccountKey(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Sélectionner un compte…</option>
                    {accounts.map((account) => (
                      <option
                        key={`${account.customerId}:${account.accountId}`}
                        value={`${account.customerId}:${account.accountId}`}
                      >
                        {account.name}
                        {account.currencyCode ? ` (${account.currencyCode})` : ""} ·{" "}
                        {account.accountId}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun compte accessible. Vérifiez les permissions OAuth ou réautorisez
                  l&apos;accès.
                </p>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => void handleConnect()}
                  disabled={connecting || loadingAccounts || !selectedAccountKey}
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => startOAuth("microsoft")}
                    disabled={connecting}
                  >
                    Changer (Microsoft)
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => startOAuth("google")}
                    disabled={connecting}
                  >
                    Changer (Google)
                  </Button>
                </div>
              </div>
            </>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
