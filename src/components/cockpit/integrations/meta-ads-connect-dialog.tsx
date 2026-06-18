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

type MetaAdsAccount = {
  adAccountId: string;
  name: string;
  currencyCode?: string;
  accountStatus?: number;
};

type MetaAdsConnectDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (options?: ConnectIntegrationOptions) => Promise<void>;
};

export function MetaAdsConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnect,
}: MetaAdsConnectDialogProps) {
  const [accounts, setAccounts] = useState<MetaAdsAccount[]>([]);
  const [selectedAdAccountId, setSelectedAdAccountId] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthDone, setOauthDone] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connectors/meta-ads/accounts?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json()) as {
        accounts?: MetaAdsAccount[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de charger les comptes Meta Ads");
      }
      const list = data.accounts ?? [];
      setAccounts(list);
      if (list.length === 1) {
        setSelectedAdAccountId(list[0]!.adAccountId);
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
      setSelectedAdAccountId("");
      setOauthDone(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("meta_ads_oauth");
    if (oauthStatus === "1") {
      setOauthDone(true);
      void loadAccounts();
      params.delete("meta_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "token_error") {
      setError("Échange OAuth échoué. Réessayez ou vérifiez la configuration serveur.");
      params.delete("meta_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    } else if (oauthStatus === "encryption_error") {
      setError("Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY).");
      params.delete("meta_ads_oauth");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [open, loadAccounts]);

  function startOAuth() {
    window.location.href = `/api/connectors/meta-ads/oauth?projectId=${encodeURIComponent(projectId)}`;
  }

  async function handleConnect() {
    if (!selectedAdAccountId) {
      setError("Sélectionnez un compte publicitaire Meta.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await onConnect({ mode: "real", adAccountId: selectedAdAccountId });
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
          <DialogTitle>Connecter Meta Ads</DialogTitle>
          <DialogDescription>
            Autorisez l&apos;accès à vos campagnes Facebook et Instagram, puis choisissez le
            compte publicitaire à synchroniser. Métriques : budget, impressions, clics et
            conversions sur 12 mois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!oauthDone ? (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Prérequis</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Compte Meta Business avec accès publicitaire</li>
                  <li>Scope OAuth : ads_read (lecture des insights)</li>
                  <li>App Meta configurée avec Marketing API</li>
                </ul>
                <a
                  href="https://developers.facebook.com/docs/marketing-api/get-started/authorization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Documentation Meta Marketing API
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button className="w-full" onClick={startOAuth}>
                Continuer avec Meta
              </Button>
            </>
              ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Vos données déjà synchronisées restent visibles dans le cockpit pendant que
                vous reconnectez Meta Ads.
              </div>
              {loadingAccounts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des comptes publicitaires…
                </div>
              ) : accounts.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="meta-ads-account">Compte publicitaire</Label>
                  <select
                    id="meta-ads-account"
                    value={selectedAdAccountId}
                    onChange={(e) => setSelectedAdAccountId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Sélectionner un compte…</option>
                    {accounts.map((account) => (
                      <option key={account.adAccountId} value={account.adAccountId}>
                        {account.name}
                        {account.currencyCode ? ` (${account.currencyCode})` : ""}
                        {account.accountStatus !== undefined && account.accountStatus !== 1
                          ? " · inactif"
                          : ""}{" "}
                        · {account.adAccountId}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun compte publicitaire accessible. Vérifiez les permissions OAuth ou
                  réautorisez l&apos;accès.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  onClick={() => void handleConnect()}
                  disabled={connecting || loadingAccounts || !selectedAdAccountId}
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
                  Changer de compte Meta
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
