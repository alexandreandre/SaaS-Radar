"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Rafraîchir
          </Button>
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
              hint={`${formatNumber(data.stats.totalSubscribers)} inscrits au total`}
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
              hint={CADENCE_LABELS[data.stats.cadenceStatus]}
              alert={data.stats.deliveryIssues > 0 || cadenceIsAlert(data.stats.cadenceStatus)}
            />
          </div>

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
    </div>
  );
}
