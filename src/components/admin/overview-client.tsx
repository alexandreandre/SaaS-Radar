"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdminPageHeader,
  AdminSection,
  AdminTable,
  KpiCardLink,
} from "@/components/admin/admin-ui";
import type {
  AdminOverviewMetrics,
  BillingSnapshot,
  SourcingRunSummary,
} from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

function formatEuro(cents: number) {
  return `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;
}

function formatDuration(startedAt: string, finishedAt: string | null, now = Date.now()): string {
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : now;
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`;
}

function RunDuration({
  startedAt,
  finishedAt,
}: {
  startedAt: string;
  finishedAt: string | null;
}) {
  const [label, setLabel] = useState(() =>
    finishedAt ? formatDuration(startedAt, finishedAt) : ""
  );

  useEffect(() => {
    if (finishedAt) return;
    const tick = () => setLabel(formatDuration(startedAt, null));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt, finishedAt]);

  if (finishedAt) return <>{label}</>;
  return <span suppressHydrationWarning>{label || "…"}</span>;
}

const RUN_STATUS_LABELS: Record<string, string> = {
  ok: "Terminé",
  success: "Succès",
  empty: "Vide",
  error: "Erreur",
  running: "En cours",
  queued: "En file",
  partial: "Partiel",
};

function runStatusClass(status: string): string {
  if (status === "success") return "bg-emerald-500/15 text-emerald-700";
  if (status === "error") return "bg-red-500/15 text-red-700";
  if (status === "running" || status === "queued") return "bg-blue-500/15 text-blue-700";
  if (status === "empty") return "bg-amber-500/15 text-amber-700";
  return "bg-muted text-muted-foreground";
}

function PlanDistributionBar({
  free,
  builder,
  pro,
}: {
  free: number;
  builder: number;
  pro: number;
}) {
  const total = free + builder + pro || 1;
  const segments = [
    { label: "Free", count: free, color: "bg-muted-foreground/40" },
    { label: "Builder", count: builder, color: "bg-primary/60" },
    { label: "Pro", count: pro, color: "bg-primary" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Répartition plans
      </p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <div
              key={seg.label}
              className={cn(seg.color, "transition-all")}
              style={{ width: `${(seg.count / total) * 100}%` }}
              title={`${seg.label}: ${seg.count}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((seg) => (
          <span key={seg.label}>
            <span className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", seg.color)} />
            {seg.label} : {seg.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function MrrSparkline({ history, currentMrrCents }: { history: BillingSnapshot[]; currentMrrCents: number }) {
  const points = [...history]
    .reverse()
    .slice(-30)
    .map((s) => s.mrr_cents);

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tendance MRR (30 j)
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Aucun snapshot —{" "}
          <Link href="/admin/billing" className="text-primary hover:underline">
            créer depuis Abonnements
          </Link>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          MRR actuel : {formatEuro(currentMrrCents)}
        </p>
      </div>
    );
  }

  const max = Math.max(...points, 1);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Tendance MRR (30 j)
      </p>
      <div className="mt-3 flex h-12 items-end gap-0.5">
        {points.map((mrr, i) => (
          <div
            key={i}
            className="min-w-0 flex-1 rounded-sm bg-primary/70 transition-all hover:bg-primary"
            style={{ height: `${Math.max(4, (mrr / max) * 100)}%` }}
            title={`${formatEuro(mrr)}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {points.length} point{points.length > 1 ? "s" : ""} — actuel {formatEuro(currentMrrCents)}
      </p>
    </div>
  );
}

function AttentionBanner({ metrics }: { metrics: AdminOverviewMetrics }) {
  const alerts: { message: string; href: string }[] = [];

  if (metrics.billing.pastDueCount > 0) {
    alerts.push({
      message: `${metrics.billing.pastDueCount} abonné(s) en impayé (past due)`,
      href: "/admin/billing",
    });
  }
  if (metrics.recentSourcingErrors.length > 0) {
    alerts.push({
      message: `${metrics.recentSourcingErrors.length} run(s) sourcing en erreur (< 24 h)`,
      href: "/admin/system",
    });
  }
  if (metrics.costAlert) {
    alerts.push({
      message: `Plafond coût sourcing dépassé (${metrics.sourcingCostMonthUsd.toFixed(2)} USD ce mois)`,
      href: "/admin/system",
    });
  }
  const missingServices = Object.entries(metrics.healthChecks)
    .filter(([, ok]) => !ok)
    .map(([key]) => key);
  if (missingServices.length > 0) {
    alerts.push({
      message: `Configuration manquante : ${missingServices.join(", ")}`,
      href: "/admin/system",
    });
  }
  if (metrics.pendingDrafts > 5) {
    alerts.push({
      message: `${metrics.pendingDrafts} brouillons en attente`,
      href: "/admin/sourcing",
    });
  }
  if (metrics.draftsNeedingReview > 0) {
    alerts.push({
      message: `${metrics.draftsNeedingReview} brouillon(s) à revoir`,
      href: "/admin/sourcing",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">Attention requise</p>
          <ul className="mt-1 space-y-0.5">
            {alerts.map((a) => (
              <li key={a.message}>
                <Link href={a.href} className="text-sm text-amber-800 hover:underline">
                  {a.message}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function HealthChecksLine({
  checks,
}: {
  checks: AdminOverviewMetrics["healthChecks"];
}) {
  const labels: Record<string, string> = {
    supabase: "Supabase",
    stripe: "Stripe",
    openrouter: "OpenRouter",
    revalidate: "Revalidate",
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground">Santé services</span>
      {Object.entries(checks).map(([key, ok]) => (
        <span key={key} className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              ok ? "bg-emerald-500" : "bg-red-500"
            )}
          />
          <span className="capitalize">{labels[key] ?? key}</span>
          <span className={ok ? "text-emerald-600" : "text-red-600"}>
            {ok ? "OK" : "Manquant"}
          </span>
        </span>
      ))}
      <Link href="/admin/system" className="ml-auto text-xs text-primary hover:underline">
        Détails →
      </Link>
    </div>
  );
}

function SourcingPipelineBlock({
  lastRun,
  activeRunsCount,
  sourcingCostMonthUsd,
  sourcingMetrics7d,
}: {
  lastRun: SourcingRunSummary | null;
  activeRunsCount: number;
  sourcingCostMonthUsd: number;
  sourcingMetrics7d: AdminOverviewMetrics["sourcingMetrics7d"];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Pipeline sourcing</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activeRunsCount > 0
              ? `${activeRunsCount} run(s) actif(s) en ce moment`
              : "Aucun run en cours"}
            {" · "}
            {sourcingCostMonthUsd.toFixed(2)} USD ce mois
            {" · "}
            7 j : {sourcingMetrics7d.runs_total} run(s), {sourcingMetrics7d.drafts_written} écrit(s)
          </p>
        </div>
        <Link href="/admin/sourcing" className="text-xs text-primary hover:underline">
          Ouvrir Sourcing →
        </Link>
      </div>

      {lastRun ? (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Dernier run</span>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium",
                runStatusClass(lastRun.status)
              )}
            >
              {RUN_STATUS_LABELS[lastRun.status] ?? lastRun.status}
            </span>
            {lastRun.origin_country_code && (
              <span className="text-xs text-muted-foreground">{lastRun.origin_country_code}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(lastRun.started_at).toLocaleString("fr-FR")}
            {" · "}
            Durée{" "}
            <RunDuration startedAt={lastRun.started_at} finishedAt={lastRun.finished_at} />
            {" · "}
            {lastRun.count_written} écrit(s)
            {lastRun.cost_usd != null && ` · $${lastRun.cost_usd.toFixed(2)}`}
          </p>
          {lastRun.status === "error" && lastRun.error && (
            <p className="text-sm text-red-600">
              {lastRun.error.slice(0, 200)}
              {lastRun.error.length > 200 ? "…" : ""}{" "}
              <Link href="/admin/system" className="text-primary hover:underline">
                Voir Système
              </Link>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
          Aucun run sourcing enregistré.
        </p>
      )}
    </div>
  );
}

type OverviewClientProps = {
  initialMetrics: AdminOverviewMetrics | null;
  initialError: string | null;
};

export function OverviewClient({ initialMetrics, initialError }: OverviewClientProps) {
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(initialMetrics);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Impossible de charger les métriques");
        return;
      }
      const { ok: _ok, ...data } = json as AdminOverviewMetrics & { ok: boolean };
      setMetrics(data as AdminOverviewMetrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadedAtLabel = metrics?.loadedAt
    ? new Date(metrics.loadedAt).toLocaleString("fr-FR")
    : null;

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description={
          loadedAtLabel
            ? `Vue d'ensemble actualisée au ${loadedAtLabel}.`
            : "Vue d'ensemble de la plateforme SaaS Radar."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Rafraîchir
          </Button>
        }
      />

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-800">
            Impossible de charger les métriques : {error}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Réessayer
          </Button>
        </div>
      )}

      {metrics && (
        <div className="space-y-8">
          <AttentionBanner metrics={metrics} />
          <HealthChecksLine checks={metrics.healthChecks} />

          <AdminSection title="Produit" description="Catalogue et audience">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCardLink
                href="/admin/opportunities"
                label="Fiches publiées"
                value={metrics.publishedOpportunities}
              />
              <KpiCardLink
                href="/admin/sourcing"
                label="Brouillons en attente"
                value={metrics.pendingDrafts}
                hint={
                  metrics.draftsNeedingReview > 0
                    ? `${metrics.draftsNeedingReview} à revoir`
                    : undefined
                }
                alert={metrics.draftsNeedingReview > 0}
              />
              <KpiCardLink href="/admin/users" label="Utilisateurs" value={metrics.totalUsers} />
              <KpiCardLink
                href="/admin/newsletter"
                label="Abonnés newsletter"
                value={metrics.newsletterSubscribers}
              />
            </div>
          </AdminSection>

          <AdminSection
            title="Revenus"
            description="Abonnements et facturation"
            action={
              <Link href="/admin/billing" className="text-xs text-primary hover:underline">
                Détail abonnements →
              </Link>
            }
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                <KpiCardLink
                  href="/admin/billing"
                  label="MRR estimé"
                  value={formatEuro(metrics.billing.mrrCents)}
                  hint={`${metrics.billing.activeSubscribers} abonnés actifs`}
                />
                <KpiCardLink
                  href="/admin/billing"
                  label="ARR estimé"
                  value={formatEuro(metrics.billing.arrCents)}
                />
                <KpiCardLink
                  href="/admin/billing"
                  label="Past due"
                  value={metrics.billing.pastDueCount}
                  alert={metrics.billing.pastDueCount > 0}
                />
              </div>
              <PlanDistributionBar
                free={metrics.billing.freeCount}
                builder={metrics.billing.builderCount}
                pro={metrics.billing.proCount}
              />
            </div>
            <MrrSparkline
              history={metrics.billingHistory}
              currentMrrCents={metrics.billing.mrrCents}
            />
          </AdminSection>

          <AdminSection title="Pipeline sourcing" description="Runs et coûts">
            <SourcingPipelineBlock
              lastRun={metrics.lastRun}
              activeRunsCount={metrics.activeRunsCount}
              sourcingCostMonthUsd={metrics.sourcingCostMonthUsd}
              sourcingMetrics7d={metrics.sourcingMetrics7d}
            />
          </AdminSection>

          <AdminSection
            title="Activité récente"
            description="Dernières actions admin"
            action={
              <Link href="/admin/audit" className="text-xs text-primary hover:underline">
                Voir tout →
              </Link>
            }
          >
            <AdminTable headers={["Date", "Acteur", "Action"]}>
              {metrics.recentAudit.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Aucune action enregistrée.
                  </td>
                </tr>
              ) : (
                metrics.recentAudit.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 text-xs">{log.actor_email ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{log.action}</td>
                  </tr>
                ))
              )}
            </AdminTable>
          </AdminSection>
        </div>
      )}
    </div>
  );
}
