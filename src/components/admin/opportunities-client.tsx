"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminTable, KpiCard } from "@/components/admin/admin-ui";
import { sectorLabels } from "@/data/opportunities";
import { SECTORS } from "@/lib/sourcing/constants";
import { canEditAdmin } from "@/lib/admin/rbac";
import { useAdminRole } from "@/contexts/admin-role-context";
import { adminFetchJson } from "@/lib/admin/client-fetch";
import { cn } from "@/lib/utils";
import type { CatalogueStats } from "@/lib/admin/catalogue-stats.shared";
import type { AdminOpportunitiesPageData } from "@/lib/admin/opportunities";

type OpportunityRow = {
  slug: string;
  name: string;
  sector: string;
  origin_country_code: string;
  origin_flag: string;
  status: string;
  weekly_pick: boolean;
  created_at: string;
  published_at: string | null;
  buildable_under_30_days: boolean;
  ai_powered: boolean;
  scores: {
    opportunity?: number;
    franceFit?: number;
    buildability?: number;
  };
};

type ListResponse = {
  opportunities: OpportunityRow[];
  total: number;
  limit: number;
  offset: number;
  truncated: boolean;
};

const PAGE_SIZE = 50;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

function parseApiError(json: { error?: string }): string {
  return json.error ?? "Erreur inconnue";
}

export function AdminOpportunitiesClient({
  initialData = null,
  initialError = null,
}: {
  initialData?: AdminOpportunitiesPageData | null;
  initialError?: string | null;
}) {
  const skipListFetch = useRef(initialData != null || initialError != null);
  const skipStatsFetch = useRef(initialData?.stats != null);
  const role = useAdminRole();
  const canEdit = canEditAdmin(role);

  const [items, setItems] = useState<OpportunityRow[]>(
    () => (initialData?.list.opportunities as OpportunityRow[] | undefined) ?? [],
  );
  const [stats, setStats] = useState<CatalogueStats | null>(initialData?.stats ?? null);
  const [total, setTotal] = useState(initialData?.list.total ?? 0);
  const [offset, setOffset] = useState(initialData?.list.offset ?? 0);

  const [status, setStatus] = useState("published");
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(!initialData && !initialError);
  const [statsLoading, setStatsLoading] = useState(!initialData?.stats && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(null);
  const [actionSlug, setActionSlug] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ status, sort, limit: String(PAGE_SIZE), offset: String(offset) });
    if (q.trim()) params.set("q", q.trim());
    if (sector) params.set("sector", sector);
    if (country.trim()) params.set("country", country.trim());
    if (minScore.trim()) params.set("minScore", minScore.trim());
    return params.toString();
  }, [status, sort, offset, q, sector, country, minScore]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { ok, data: json } = await adminFetchJson<{ stats?: CatalogueStats; error?: string }>(
        "/api/admin/opportunities/stats"
      );
      if (!ok) throw new Error(parseApiError(json));
      setStats(json.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { ok, data: json } = await adminFetchJson<ListResponse & { error?: string }>(
        `/api/admin/opportunities?${queryString}`
      );
      if (!ok) throw new Error(parseApiError(json));
      setItems(json.opportunities ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    if (skipStatsFetch.current) {
      skipStatsFetch.current = false;
      return;
    }
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (skipListFetch.current) {
      skipListFetch.current = false;
      return;
    }
    void load();
  }, [load]);

  const resetFilters = () => {
    setQ("");
    setSector("");
    setCountry("");
    setMinScore("");
    setSort("newest");
    setOffset(0);
  };

  const refreshAll = async () => {
    await Promise.all([load(), loadStats()]);
  };

  const archive = async (slug: string, name: string) => {
    if (!canEdit) return;
    if (!window.confirm(`Archiver « ${name} » ? La fiche disparaîtra du catalogue public.`)) return;

    setActionSlug(slug);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/opportunities?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(parseApiError(json));
      setMessage(`« ${name} » archivée.`);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionSlug(null);
    }
  };

  const republish = async (slug: string, name: string) => {
    if (!canEdit) return;
    setActionSlug(slug);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, status: "published" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(parseApiError(json));
      setMessage(`« ${name} » republiée.`);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionSlug(null);
    }
  };

  const toggleWeeklyPick = async (slug: string, weekly_pick: boolean) => {
    if (!canEdit) return;
    setActionSlug(slug);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, weekly_pick: !weekly_pick }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(parseApiError(json));
      setMessage(!weekly_pick ? "Pick de la semaine mis à jour." : "Pick retiré.");
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionSlug(null);
    }
  };

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + items.length, total);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  const tableHeaders = [
    "Nom",
    "Publié le",
    "Pays",
    "Secteur",
    "Score",
    "France",
    "Build",
    "Qualité",
    "Pick",
    ...(canEdit ? ["Actions"] : []),
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Catalogue"
        description="Surveiller la santé du catalogue et gérer les fiches publiées."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/opportunities"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Voir sur le site
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/admin/sourcing"
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Sourcing
              {stats && stats.pendingDrafts > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {stats.pendingDrafts}
                </span>
              )}
            </Link>
          </div>
        }
      />

      {stats && stats.alerts.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
              {stats.alerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {message && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Publiées"
          value={statsLoading ? "…" : (stats?.byStatus.published ?? "—")}
        />
        <KpiCard
          label="Archivées"
          value={statsLoading ? "…" : (stats?.byStatus.archived ?? "—")}
        />
        <KpiCard
          label="Pick actif"
          value={
            statsLoading
              ? "…"
              : stats?.weeklyPick
                ? stats.weeklyPick.name.slice(0, 24) + (stats.weeklyPick.name.length > 24 ? "…" : "")
                : "Aucun"
          }
          hint={
            stats?.weeklyPick?.score != null ? `Score ${stats.weeklyPick.score}` : undefined
          }
        />
        <KpiCard
          label="Publiées (7 j)"
          value={statsLoading ? "…" : (stats?.publishedThisWeek ?? "—")}
        />
        <KpiCard
          label="Score médian"
          value={statsLoading ? "…" : stats?.medianScore != null ? Math.round(stats.medianScore) : "—"}
        />
        <Link href="/admin/sourcing" className="block transition-opacity hover:opacity-90">
          <KpiCard
            label="Brouillons sourcing"
            value={statsLoading ? "…" : (stats?.pendingDrafts ?? "—")}
            hint="En attente de validation"
            className="h-full"
          />
        </Link>
      </div>

      {stats?.lastRun && (
        <p className="text-xs text-muted-foreground">
          Dernier run sourcing :{" "}
          {new Date(stats.lastRun.started_at).toLocaleString("fr-FR")} — statut{" "}
          <strong>{stats.lastRun.status}</strong> — {stats.lastRun.count_written} écrit(s)
        </p>
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">Couverture catalogue</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {stats?.diversity.uniqueCountries ?? 0} pays · diversité top pays{" "}
          {stats ? `${Math.round(stats.diversity.topCountryShare * 100)} %` : "—"}
          {stats?.diversity.topCountryCode ? ` (${stats.diversity.topCountryCode})` : ""}
        </p>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Par secteur
            </p>
            <div className="mt-2 space-y-2">
              {(stats?.bySector ?? []).slice(0, 8).map((row) => (
                <div key={row.sector} className="flex items-center gap-2 text-sm">
                  <span className="w-28 shrink-0 truncate">
                    {sectorLabels[row.sector] ?? row.sector}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, ((row.count / Math.max(stats?.byStatus.published ?? 1, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                    {row.count} · {Math.round(row.medianScore)}
                  </span>
                </div>
              ))}
              {!statsLoading && (stats?.bySector.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Aucune donnée secteur.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Par pays
            </p>
            <div className="mt-2 space-y-2">
              {(stats?.byCountry ?? []).slice(0, 8).map((row) => (
                <div key={row.code} className="flex items-center gap-2 text-sm">
                  <span className="w-28 shrink-0 truncate">
                    {row.flag} {row.name}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{
                        width: `${Math.min(100, ((row.count / Math.max(stats?.byStatus.published ?? 1, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                    {row.count} · {Math.round(row.medianScore)}
                  </span>
                </div>
              ))}
            </div>

            {(stats?.marketsWithoutCoverage.length ?? 0) > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Marchés actifs sans fiche ({stats!.marketsWithoutCoverage.length})
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats!.marketsWithoutCoverage
                    .slice(0, 12)
                    .map((m) => `${m.flag} ${m.code}`)
                    .join(" · ")}
                  {stats!.marketsWithoutCoverage.length > 12 ? " …" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="flex rounded-md border border-border p-0.5">
            {(
              [
                ["published", "Publiées"],
                ["archived", "Archivées"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatus(value);
                  setOffset(0);
                }}
                className={cn(
                  "rounded px-3 py-1.5 text-sm transition-colors",
                  status === value
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder="Rechercher nom ou slug…"
            className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />

          <select
            value={sector}
            onChange={(e) => {
              setSector(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tous secteurs</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {sectorLabels[s] ?? s}
              </option>
            ))}
          </select>

          <input
            value={country}
            onChange={(e) => {
              setCountry(e.target.value.toUpperCase());
              setOffset(0);
            }}
            placeholder="Pays (ISO2)"
            maxLength={2}
            className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm uppercase"
          />

          <input
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value);
              setOffset(0);
            }}
            placeholder="Score min"
            type="number"
            min={0}
            max={100}
            className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Plus récent</option>
            <option value="opportunity">Score opportunity</option>
            <option value="name">Nom A→Z</option>
          </select>

          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {loading
              ? "Chargement…"
              : total === 0
                ? "0 fiche"
                : `${pageStart}–${pageEnd} sur ${total} fiche${total > 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasPrev || loading}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              <ChevronLeft className="h-4 w-4" />
              Préc.
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasNext || loading}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Suiv.
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            Chargement du catalogue…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {status === "published" ? (
              <>
                Aucune fiche publiée.
                <Link href="/admin/sourcing" className="ml-1 text-primary hover:underline">
                  Voir le sourcing
                </Link>
              </>
            ) : status === "archived" ? (
              "Aucune fiche archivée."
            ) : (
              "Aucun résultat pour ces filtres."
            )}
          </div>
        ) : (
          <AdminTable headers={tableHeaders}>
            {items.map((o) => (
              <tr
                key={o.slug}
                className={cn(
                  "border-t border-border",
                  o.weekly_pick && "bg-primary/5"
                )}
              >
                <td className="px-3 py-2">
                  <Link href={`/opportunities/${o.slug}`} className="hover:text-primary" target="_blank">
                    {o.name}
                  </Link>
                  {o.weekly_pick && (
                    <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                      Pick semaine
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(o.published_at ?? o.created_at)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {o.origin_flag} {o.origin_country_code}
                </td>
                <td className="px-3 py-2">{sectorLabels[o.sector] ?? o.sector}</td>
                <td className="px-3 py-2 tabular-nums">{o.scores?.opportunity ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {o.scores?.franceFit ?? "—"}
                </td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {o.scores?.buildability ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {o.buildable_under_30_days && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">30j</span>
                    )}
                    {o.ai_powered && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">IA</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">{o.weekly_pick ? "★" : "—"}</td>
                {canEdit && (
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {status === "published" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionSlug === o.slug}
                            onClick={() => void toggleWeeklyPick(o.slug, o.weekly_pick)}
                          >
                            {o.weekly_pick ? "Retirer pick" : "Pick"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionSlug === o.slug}
                            onClick={() => void archive(o.slug, o.name)}
                          >
                            Archiver
                          </Button>
                        </>
                      )}
                      {status === "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionSlug === o.slug}
                          onClick={() => void republish(o.slug, o.name)}
                        >
                          Republier
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </AdminTable>
        )}
      </section>
    </div>
  );
}
