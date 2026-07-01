"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Plus, RefreshCw, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AdminPageHeader,
  AdminSection,
  AdminTable,
  KpiCard,
} from "@/components/admin/admin-ui";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { adminFetchJson } from "@/lib/admin/client-fetch";
import type {
  AdminNewsletterData,
  NewsletterCadenceStatus,
  NewsletterCampaignStatus,
  NewsletterCampaignSummary,
  NewsletterSubscriberStatus,
} from "@/lib/admin/newsletter";
import { cn } from "@/lib/utils";

type NewsletterClientProps = {
  initialData?: AdminNewsletterData | null;
  initialError?: string | null;
};

const CAMPAIGN_STATUS_LABELS: Record<NewsletterCampaignStatus, string> = {
  draft: "Brouillon",
  scheduled: "Planifiée",
  sent: "Envoyée",
  cancelled: "Annulée",
};

const CADENCE_LABELS: Record<NewsletterCadenceStatus, string> = {
  on_time: "À jour",
  due_today: "Fenêtre du jour",
  late: "En retard",
  never_sent: "Jamais envoyée",
};

const SUBSCRIBER_STATUS_LABELS: Record<NewsletterSubscriberStatus, string> = {
  pending: "En attente",
  active: "Actif",
  unsubscribed: "Désabonné",
  bounced: "Bounce",
};

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

function formatSigned(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

function formatPercent(value: number | null, enabled = true): string {
  if (!enabled || value == null) return "—";
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function campaignStatusClass(status: NewsletterCampaignStatus): string {
  if (status === "sent") return "bg-emerald-500/15 text-emerald-700";
  if (status === "scheduled") return "bg-blue-500/15 text-blue-700";
  if (status === "cancelled") return "bg-red-500/15 text-red-700";
  return "bg-muted text-muted-foreground";
}

function subscriberStatusClass(status: NewsletterSubscriberStatus): string {
  if (status === "active") return "bg-emerald-500/15 text-emerald-700";
  if (status === "pending") return "bg-amber-500/15 text-amber-800";
  if (status === "bounced") return "bg-red-500/15 text-red-700";
  return "bg-muted text-muted-foreground";
}

function cadenceIsAlert(status: NewsletterCadenceStatus): boolean {
  return status === "late" || status === "never_sent";
}

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

function campaignHasTracking(campaign: NewsletterCampaignSummary): boolean {
  return Object.values(campaign.events).some((value) => value > 0);
}

function NewsletterNotice({ data }: { data: AdminNewsletterData }) {
  const alerts: string[] = [];

  if (data.stats.cadenceStatus === "never_sent") {
    alerts.push("Aucune campagne envoyée n'est encore enregistrée.");
  }
  if (data.stats.cadenceStatus === "late") {
    alerts.push("Le dernier envoi est en retard par rapport au cron hebdomadaire.");
  }
  if (!data.stats.hasEventTracking) {
    alerts.push("Les taux open/click resteront vides tant que newsletter_events n'est pas alimentée.");
  }
  if (data.stats.deliveryIssues > 0) {
    alerts.push(`${data.stats.deliveryIssues} incident(s) de livraison détecté(s).`);
  }

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-900">À surveiller</p>
          <p className="mt-1 text-sm text-amber-800">{alerts.join(" ")}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminNewsletterClient({
  initialData = null,
  initialError = null,
}: NewsletterClientProps) {
  const skipFetch = useRef(initialData != null || initialError != null);
  const [data, setData] = useState<AdminNewsletterData | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberError, setSubscriberError] = useState<string | null>(null);
  const [subscriberSaving, setSubscriberSaving] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendQuery, setSendQuery] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async (skipCache = false) => {
    const { ok, data: json } = await adminFetchJson<AdminNewsletterData & { error?: string }>(
      "/api/admin/newsletter",
      { skipCache }
    );
    if (ok) {
      setData(json);
      setError(null);
    } else {
      setError(json.error ?? "Impossible de charger les métriques newsletter");
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const activeSubscribers = useMemo(
    () => data?.subscribers.filter((subscriber) => subscriber.status === "active") ?? [],
    [data?.subscribers]
  );

  const filteredActiveSubscribers = useMemo(() => {
    const query = sendQuery.trim().toLowerCase();
    if (!query) return activeSubscribers;
    return activeSubscribers.filter(
      (subscriber) =>
        subscriber.email.toLowerCase().includes(query) ||
        (subscriber.source ?? "").toLowerCase().includes(query)
    );
  }, [activeSubscribers, sendQuery]);

  const selectedEmailSet = useMemo(() => new Set(selectedEmails), [selectedEmails]);

  const openManualSend = useCallback(() => {
    setSelectedEmails(activeSubscribers.map((subscriber) => subscriber.email));
    setSendQuery("");
    setSendError(null);
    setSendSuccess(null);
    setSendDialogOpen(true);
  }, [activeSubscribers]);

  const toggleEmail = useCallback((email: string, checked: boolean) => {
    setSelectedEmails((current) => {
      const next = new Set(current);
      if (checked) next.add(email);
      else next.delete(email);
      return Array.from(next);
    });
  }, []);

  const setFilteredSelection = useCallback(
    (checked: boolean) => {
      const filteredEmails = filteredActiveSubscribers.map((subscriber) => subscriber.email);
      setSelectedEmails((current) => {
        const next = new Set(current);
        for (const email of filteredEmails) {
          if (checked) next.add(email);
          else next.delete(email);
        }
        return Array.from(next);
      });
    },
    [filteredActiveSubscribers]
  );

  const addSubscriber = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const emails = Array.from(
        new Set(
          subscriberEmail
            .toLowerCase()
            .match(/[^\s,;<>"]+@[^\s,;<>"]+\.[^\s,;<>"]+/g) ?? []
        )
      );

      if (emails.length === 0) {
        setSubscriberError("Aucun email valide détecté.");
        return;
      }

      setSubscriberSaving(true);
      setSubscriberError(null);
      try {
        const { ok, data: json } = await adminFetchJson<{ error?: string }>(
          "/api/admin/newsletter",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "subscriber", emails, source: "admin" }),
          }
        );

        if (!ok) {
          setSubscriberError(json.error ?? "Impossible d'ajouter cet abonné.");
          return;
        }

        setSubscriberEmail("");
        await load(true);
      } finally {
        setSubscriberSaving(false);
      }
    },
    [load, subscriberEmail]
  );

  const sendManualNewsletter = useCallback(async () => {
    if (selectedEmails.length === 0) {
      setSendError("Sélectionne au moins un abonné actif.");
      return;
    }

    setSending(true);
    setSendError(null);
    setSendSuccess(null);
    try {
      const { ok, data: json } = await adminFetchJson<{
        error?: string;
        result?: { recipientCount?: number };
      }>("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "manual_send", emails: selectedEmails }),
      });

      if (!ok) {
        setSendError(json.error ?? "Envoi manuel impossible.");
        return;
      }

      const recipientCount = json.result?.recipientCount ?? selectedEmails.length;
      setSendSuccess(`${formatNumber(recipientCount)} envoi(s) lancé(s).`);
      await load(true);
    } finally {
      setSending(false);
    }
  }, [load, selectedEmails]);

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    void load();
  }, [load]);

  if (loading && !data) {
    return <AdminPageSkeleton kpiCount={6} />;
  }

  const loadedAtLabel = data?.loadedAt ? formatDateTime(data.loadedAt) : null;

  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        description={
          loadedAtLabel
            ? `Suivi hebdo des envois et abonnés. Actualisé au ${loadedAtLabel}.`
            : "Suivi hebdo des envois et abonnés."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openManualSend}
              disabled={activeSubscribers.length === 0}
            >
              <Send className="h-4 w-4" />
              Envoi manuel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Rafraîchir
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-800">
            Impossible de charger la newsletter : {error}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Réessayer
          </Button>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <NewsletterNotice data={data} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Abonnés actifs"
              value={formatNumber(data.stats.activeSubscribers)}
              hint={`${formatNumber(data.stats.totalSubscribers)} inscrits · ${formatNumber(data.stats.pendingSubscribers)} en attente`}
            />
            <KpiCard
              label="Croissance 30j"
              value={formatSigned(data.stats.netGrowth30d)}
              hint={`${data.stats.newSubscribers30d} nouveaux · ${data.stats.unsubscribed30d} désabonnés`}
            />
            <KpiCard
              label="Campagnes envoyées"
              value={formatNumber(data.stats.sentCampaigns)}
              hint={`${data.stats.scheduleLabel} · ${data.stats.senderEmail}`}
            />
            <KpiCard
              label="Dernier envoi"
              value={formatDate(data.stats.lastSentAt)}
              hint={`${formatNumber(data.stats.lastRecipientCount)} destinataire(s) · prochain ${formatDate(data.stats.nextSendAt)}`}
              alert={cadenceIsAlert(data.stats.cadenceStatus)}
            />
            <KpiCard
              label="Taux d'ouverture"
              value={formatPercent(data.stats.openRate, data.stats.hasEventTracking)}
              hint={`Clic : ${formatPercent(data.stats.clickRate, data.stats.hasEventTracking)}`}
            />
            <KpiCard
              label="Incidents"
              value={formatNumber(data.stats.deliveryIssues)}
              hint={`${CADENCE_LABELS[data.stats.cadenceStatus]} · ${formatNumber(data.stats.bouncedSubscribers)} bounce`}
              alert={data.stats.deliveryIssues > 0 || cadenceIsAlert(data.stats.cadenceStatus)}
            />
          </div>

          <AdminSection
            title="Abonnés newsletter"
            description={`${formatNumber(data.stats.totalSubscribers)} inscrits au total · ${formatNumber(data.stats.activeSubscribers)} actifs · ${formatNumber(data.stats.unsubscribedSubscribers)} désabonnés`}
            action={
              <form onSubmit={addSubscriber} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="text"
                  value={subscriberEmail}
                  onChange={(event) => setSubscriberEmail(event.target.value)}
                  placeholder="email@domaine.com, autre@email.com"
                  className="h-8 w-full sm:w-72"
                  disabled={subscriberSaving}
                />
                <Button size="sm" type="submit" disabled={subscriberSaving}>
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </form>
            }
          >
            {subscriberError && (
              <p className="-mt-2 text-xs text-red-700">{subscriberError}</p>
            )}
            <AdminTable headers={["Email", "Statut", "Source", "Inscription", "Confirmation", "Désabonnement"]}>
              {data.subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Aucun abonné newsletter enregistré.
                  </td>
                </tr>
              ) : (
                data.subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-t border-border">
                    <td className="max-w-[280px] px-3 py-2">
                      <p className="truncate text-sm font-medium">{subscriber.email}</p>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        label={SUBSCRIBER_STATUS_LABELS[subscriber.status]}
                        className={subscriberStatusClass(subscriber.status)}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {subscriber.source ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDateTime(subscriber.created_at)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDateTime(subscriber.confirmed_at)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDateTime(subscriber.unsubscribed_at)}
                    </td>
                  </tr>
                ))
              )}
            </AdminTable>
          </AdminSection>

          <AdminSection title="Dernières campagnes" description="8 dernières entrées enregistrées">
            <AdminTable headers={["Campagne", "Statut", "Envoi", "Dest.", "Open", "Click", "Bounce"]}>
              {data.campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Aucune campagne enregistrée.
                  </td>
                </tr>
              ) : (
                data.campaigns.map((campaign) => {
                  const hasTracking = campaignHasTracking(campaign);
                  return (
                    <tr key={campaign.id} className="border-t border-border">
                      <td className="max-w-[320px] px-3 py-2">
                        <p className="truncate text-sm font-medium">{campaign.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {campaign.subject}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={CAMPAIGN_STATUS_LABELS[campaign.status]}
                          className={campaignStatusClass(campaign.status)}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatDateTime(campaign.sent_at)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatNumber(campaign.recipient_count)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatPercent(campaign.openRate, hasTracking)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatPercent(campaign.clickRate, hasTracking)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatPercent(campaign.bounceRate, hasTracking)}
                      </td>
                    </tr>
                  );
                })
              )}
            </AdminTable>
          </AdminSection>
        </div>
      )}

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Envoi manuel newsletter</DialogTitle>
            <DialogDescription>
              Tous les abonnés actifs sont sélectionnés par défaut. L&apos;envoi manuel respecte exactement cette sélection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 overflow-hidden">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={sendQuery}
                  onChange={(event) => setSendQuery(event.target.value)}
                  placeholder="Rechercher par email ou source"
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFilteredSelection(true)}
                  disabled={filteredActiveSubscribers.length === 0 || sending}
                >
                  Tout cocher
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFilteredSelection(false)}
                  disabled={filteredActiveSubscribers.length === 0 || sending}
                >
                  Retirer
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span>
                  {formatNumber(selectedEmails.length)} sélectionné(s) sur {formatNumber(activeSubscribers.length)} actif(s)
                </span>
                <span>{formatNumber(filteredActiveSubscribers.length)} affiché(s)</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {filteredActiveSubscribers.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Aucun abonné actif ne correspond à la recherche.
                  </p>
                ) : (
                  filteredActiveSubscribers.map((subscriber) => (
                    <label
                      key={subscriber.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 hover:bg-muted/30"
                    >
                      <Checkbox
                        checked={selectedEmailSet.has(subscriber.email)}
                        onCheckedChange={(checked) =>
                          toggleEmail(subscriber.email, checked === true)
                        }
                        disabled={sending}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {subscriber.email}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {subscriber.source ?? "source inconnue"} · inscrit le {formatDate(subscriber.created_at)}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {sendError && <p className="text-sm text-red-700">{sendError}</p>}
            {sendSuccess && <p className="text-sm text-emerald-700">{sendSuccess}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSendDialogOpen(false)}
              disabled={sending}
            >
              Fermer
            </Button>
            <Button
              type="button"
              onClick={() => void sendManualNewsletter()}
              disabled={sending || selectedEmails.length === 0}
            >
              <Send className="h-4 w-4" />
              {sending ? "Envoi..." : `Envoyer à ${formatNumber(selectedEmails.length)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
