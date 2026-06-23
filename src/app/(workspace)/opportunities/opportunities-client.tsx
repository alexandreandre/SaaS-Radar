"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { sectorLabels } from "@/data/sector-labels";
import {
  defaultFilters,
  filterOpportunities,
  type FilterState,
  type SortOption,
} from "@/lib/filters";
import { useFavorites } from "@/contexts/favorites-context";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type {
  OpportunityListItem,
  Sector,
  TechComplexity,
  FranceCompetition,
} from "@/types/opportunity";
import { flagFromAlpha2 } from "@/lib/country-code";
import { getPresentSectorChips, getSectorFilterKey } from "@/data/sectors";
import { cn } from "@/lib/utils";
import { ChevronDown, Filter, Search, SearchX, X } from "lucide-react";
const SectorSearchPicker = dynamic(
  () =>
    import("@/components/opportunities/sector-search-picker").then((m) => m.SectorSearchPicker),
  { ssr: false }
);

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "opportunity", label: "Top Opportunity Score" },
  { value: "newest", label: "Plus récent" },
  { value: "buildability", label: "Plus facile à construire" },
  { value: "margin", label: "Marge la plus haute" },
];

const techLabels: Record<TechComplexity, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
};

const competitionLabels: Record<FranceCompetition, string> = {
  none: "Aucune",
  low: "Faible",
  medium: "Moyenne",
  high: "Forte",
};

const revenueLabels: Record<number, string> = {
  5000: "5 000€+/mois",
  10000: "10 000€+/mois",
  20000: "20 000€+/mois",
};

/** Espace sous le logo flottant discovery (mobile). */
const MOBILE_DISCOVERY_CHROME_TOP =
  "max(0.75rem, env(safe-area-inset-top, 0px)) + 2.5rem + 1.25rem";

const mobileFilterStickyTop = (discovery: boolean) =>
  discovery
    ? `calc(${MOBILE_DISCOVERY_CHROME_TOP})`
    : "3.5rem";

const chipClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1 rounded-sm px-2 py-1 font-data text-[10px] font-medium uppercase tracking-data transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-primary text-primary-foreground"
      : "border border-border bg-muted/50 text-muted-foreground hover:text-foreground"
  );

const sectorChipClass = (active: boolean) =>
  cn(
    "rounded-sm px-3 py-1.5 font-data text-[10px] font-medium uppercase tracking-data transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
  );

type OpportunitiesClientProps = {
  opportunities: OpportunityListItem[];
  discovery: boolean;
};

type ActiveChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

function isFilterActive(filters: FilterState): boolean {
  return (
    filters.countryCode !== null ||
    filters.sectors.length > 0 ||
    filters.techComplexity.length > 0 ||
    filters.franceCompetition.length > 0 ||
    filters.revenueMin > 0 ||
    filters.buildableUnder30 ||
    filters.b2bOnly ||
    filters.search !== "" ||
    filters.thisWeekOnly ||
    filters.favoritesOnly
  );
}

function countActiveFilters(filters: FilterState): number {
  let n = 0;
  if (filters.countryCode) n++;
  if (filters.sectors.length) n++;
  if (filters.techComplexity.length) n++;
  if (filters.franceCompetition.length) n++;
  if (filters.revenueMin > 0) n++;
  if (filters.buildableUnder30) n++;
  if (filters.b2bOnly) n++;
  if (filters.search) n++;
  if (filters.thisWeekOnly) n++;
  if (filters.favoritesOnly) n++;
  return n;
}

function describeRestrictiveFilters(filters: FilterState): string[] {
  const parts: string[] = [];
  if (filters.countryCode) parts.push(filters.countryCode);
  if (filters.sectors.length) {
    parts.push(filters.sectors.map((s) => sectorLabels[s] ?? s).join(", "));
  }
  if (filters.b2bOnly) parts.push("B2B");
  if (filters.revenueMin > 0) parts.push(revenueLabels[filters.revenueMin] ?? `${filters.revenueMin}€`);
  if (filters.favoritesOnly) parts.push("Favoris");
  return parts.slice(0, 3);
}

export function OpportunitiesClient({ opportunities, discovery }: OpportunitiesClientProps) {
  return (
    <Suspense fallback={<OpportunitiesFallback />}>
      <OpportunitiesContent opportunities={opportunities} discovery={discovery} />
    </Suspense>
  );
}

function OpportunitiesFallback() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 mobile-page-pad sm:px-6 sm:py-10">
        <p className="text-muted-foreground">Chargement des opportunités…</p>
      </main>
      <Footer />
    </>
  );
}

function OpportunitiesContent({ opportunities, discovery }: OpportunitiesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { favoriteSlugs, guestHint, clearGuestHint } = useFavorites();
  const favoriteSet = useMemo(() => new Set(favoriteSlugs), [favoriteSlugs]);

  const replaceSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `/opportunities?${qs}` : "/opportunities", { scroll: false });
    },
    [router, searchParams]
  );

  const setCountryFilter = useCallback(
    (code: string | null) => {
      const normalized = code ? code.toUpperCase() : null;
      setFilters((f) => ({ ...f, countryCode: normalized }));
      replaceSearchParams((params) => {
        if (normalized) params.set("country", normalized);
        else params.delete("country");
      });
    },
    [replaceSearchParams]
  );

  const setFavoritesFilter = useCallback(
    (on: boolean) => {
      setFilters((f) => ({ ...f, favoritesOnly: on }));
      replaceSearchParams((params) => {
        if (on) params.set("favorites", "1");
        else params.delete("favorites");
      });
    },
    [replaceSearchParams]
  );

  const resetAllFilters = useCallback(() => {
    setFilters(defaultFilters);
    router.replace("/opportunities", { scroll: false });
  }, [router]);

  useEffect(() => {
    const country = searchParams.get("country");
    const favorites = searchParams.get("favorites");
    setFilters((f) => ({
      ...f,
      countryCode: country ? country.toUpperCase() : null,
      favoritesOnly: !discovery && favorites === "1",
    }));
  }, [searchParams, discovery]);

  const countryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of opportunities) {
      const code = o.originCountryCode.toUpperCase();
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
      .map(([code, count]) => ({ code, count }));
  }, [opportunities]);

  const sectorCounts = useMemo(() => {
    const counts = new Map<Sector, number>();
    for (const o of opportunities) {
      counts.set(o.sector, (counts.get(o.sector) ?? 0) + 1);
    }
    return counts;
  }, [opportunities]);

  const sectorChips = useMemo(
    () => getPresentSectorChips(opportunities.map((o) => o.sector)),
    [opportunities]
  );

  const presentSectors = useMemo(
    () => opportunities.map((o) => o.sector),
    [opportunities]
  );

  const sectorPickerValue = useMemo(() => {
    if (filters.sectors.length === 0) return "all";
    if (filters.sectors.length === 1) return filters.sectors[0];
    return filters.sectors[0];
  }, [filters.sectors]);

  const filtered = useMemo(() => {
    let result = filterOpportunities(opportunities, filters);
    if (!discovery && filters.favoritesOnly) {
      result = result.filter((o) => favoriteSet.has(o.slug));
    }
    return result;
  }, [opportunities, filters, favoriteSet, discovery]);

  const topPickId = useMemo(() => {
    const weekly = filtered.find((o) => o.weeklyPick);
    if (weekly) return weekly.id;
    if (filtered.length === 0) return null;
    return filtered.reduce((best, o) =>
      o.scores.opportunity > best.scores.opportunity ? o : best
    ).id;
  }, [filtered]);

  const activeFilterCount = countActiveFilters(filters);
  const restrictiveLabels = describeRestrictiveFilters(filters);

  const activeChips = useMemo((): ActiveChip[] => {
    const chips: ActiveChip[] = [];

    if (filters.countryCode) {
      chips.push({
        key: "country",
        label: filters.countryCode,
        onRemove: () => setCountryFilter(null),
      });
    }
    for (const sector of filters.sectors) {
      chips.push({
        key: `sector-${sector}`,
        label: sectorLabels[sector] ?? sector,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            sectors: f.sectors.filter((s) => s !== sector),
          })),
      });
    }
    for (const t of filters.techComplexity) {
      chips.push({
        key: `tech-${t}`,
        label: `Tech ${techLabels[t]}`,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            techComplexity: f.techComplexity.filter((x) => x !== t),
          })),
      });
    }
    for (const c of filters.franceCompetition) {
      chips.push({
        key: `comp-${c}`,
        label: `Conc. ${competitionLabels[c]}`,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            franceCompetition: f.franceCompetition.filter((x) => x !== c),
          })),
      });
    }
    if (filters.revenueMin > 0) {
      chips.push({
        key: "revenue",
        label: revenueLabels[filters.revenueMin] ?? `${filters.revenueMin}€+`,
        onRemove: () => setFilters((f) => ({ ...f, revenueMin: 0 })),
      });
    }
    if (filters.search) {
      chips.push({
        key: "search",
        label: `« ${filters.search.slice(0, 20)}${filters.search.length > 20 ? "…" : ""} »`,
        onRemove: () => setFilters((f) => ({ ...f, search: "" })),
      });
    }
    if (!discovery && filters.favoritesOnly) {
      chips.push({
        key: "favorites",
        label: "Favoris",
        onRemove: () => setFavoritesFilter(false),
      });
    }
    if (filters.thisWeekOnly) {
      chips.push({
        key: "thisWeek",
        label: "Cette semaine",
        onRemove: () => setFilters((f) => ({ ...f, thisWeekOnly: false })),
      });
    }
    if (filters.buildableUnder30) {
      chips.push({
        key: "build30",
        label: "<30j",
        onRemove: () => setFilters((f) => ({ ...f, buildableUnder30: false })),
      });
    }
    if (filters.b2bOnly) {
      chips.push({
        key: "b2b",
        label: "B2B",
        onRemove: () => setFilters((f) => ({ ...f, b2bOnly: false })),
      });
    }

    return chips;
  }, [filters, setCountryFilter, setFavoritesFilter, discovery]);

  const toggleSector = (sector: Sector) => {
    setFilters((f) => ({
      ...f,
      sectors: f.sectors.includes(sector)
        ? f.sectors.filter((x) => x !== sector)
        : [...f.sectors, sector],
    }));
  };

  const handleSectorPickerChange = (sectorId: string) => {
    const key = getSectorFilterKey(sectorId);
    if (key === "all") {
      setFilters((f) => ({ ...f, sectors: [] }));
      return;
    }
    const sector = key as Sector;
    setFilters((f) => ({
      ...f,
      sectors: f.sectors.includes(sector) ? f.sectors : [...f.sectors, sector],
    }));
  };

  const resultLabel =
    filtered.length === opportunities.length
      ? `${filtered.length} opportunité${filtered.length > 1 ? "s" : ""}`
      : `${filtered.length} sur ${opportunities.length}`;

  return (
    <>
      <Navbar />
      <main
        className={cn(
          "mx-auto max-w-6xl px-4 pb-6 mobile-page-pad sm:px-6 sm:py-10",
          discovery
            ? "max-lg:pt-[calc(max(0.75rem,env(safe-area-inset-top,0px))+2.5rem+1.25rem)]"
            : "py-6",
        )}
      >
        <div id="opportunities-hero" className="h-0 overflow-hidden" aria-hidden />

        {activeChips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <span key={chip.key} className={chipClass(true)}>
                {chip.label}
                <button
                  type="button"
                  className="inline-flex rounded p-0.5 opacity-80 hover:opacity-100"
                  aria-label={`Retirer le filtre ${chip.label}`}
                  onClick={chip.onRemove}
                >
                  <X className="size-3" strokeWidth={2.5} aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}

        {guestHint && !discovery && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <span>{guestHint}</span>
            <button
              type="button"
              className="text-xs underline underline-offset-2"
              onClick={clearGuestHint}
            >
              OK
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
          <aside className="w-full shrink-0 lg:w-64">
            <button
              type="button"
              className={cn(
                "mb-3 flex min-h-12 w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium lg:hidden",
                "sticky z-40 border-border/80 bg-background/95 backdrop-blur-sm",
              )}
              style={{ top: mobileFilterStickyTop(discovery) }}
              onClick={() => setMobileFiltersOpen((v) => !v)}
              aria-expanded={mobileFiltersOpen}
            >
              <span className="inline-flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" aria-hidden />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="rounded-sm bg-primary px-1.5 py-0.5 font-data text-[10px] text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  mobileFiltersOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            <div
              className={cn(
                "sticky top-24 space-y-4 rounded-lg border border-border bg-card p-5 shadow-card",
                !mobileFiltersOpen && "hidden lg:block",
              )}
            >
              <div className="space-y-4">
                <p className="font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                  Essentiel
                </p>
                <div>
                  <Label>Recherche</Label>
                  <div className="relative mt-2">
                    <Search
                      className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      type="text"
                      placeholder="Nom, client cible..."
                      value={filters.search}
                      onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                      className="w-full rounded-lg border border-border py-2.5 pl-9 pr-3 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label>Pays</Label>
                  <select
                    className="mt-2 w-full rounded-lg border border-border px-3 py-2.5 text-base sm:text-sm"
                    value={filters.countryCode ?? ""}
                    onChange={(e) => setCountryFilter(e.target.value || null)}
                  >
                    <option value="">Tous</option>
                    {countryOptions.map(({ code, count }) => (
                      <option key={code} value={code}>
                        {flagFromAlpha2(code)} {code} ({count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-3 font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                  Secteur
                </p>
                <div className="-mx-1 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, sectors: [] }))}
                    className={sectorChipClass(filters.sectors.length === 0)}
                  >
                    Tous · {opportunities.length}
                  </button>
                  {sectorChips.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSector(s.id as Sector)}
                      className={sectorChipClass(filters.sectors.includes(s.id as Sector))}
                    >
                      {s.label}
                      {sectorCounts.get(s.id as Sector)
                        ? ` · ${sectorCounts.get(s.id as Sector)}`
                        : ""}
                    </button>
                  ))}
                  <SectorSearchPicker
                    value={sectorPickerValue}
                    onChange={handleSectorPickerChange}
                    chipClass={sectorChipClass}
                    presentSectors={presentSectors}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-3 font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                  Raccourcis
                </p>
                <div className="space-y-3">
                  {!discovery ? (
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="favoritesOnly" className="text-sm font-normal text-muted-foreground">
                        Mes favoris
                      </Label>
                      <Switch
                        id="favoritesOnly"
                        checked={filters.favoritesOnly}
                        onCheckedChange={setFavoritesFilter}
                      />
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="thisWeek" className="text-sm font-normal text-muted-foreground">
                      Nouveautés cette semaine
                    </Label>
                    <Switch
                      id="thisWeek"
                      checked={filters.thisWeekOnly}
                      onCheckedChange={(v) => setFilters((f) => ({ ...f, thisWeekOnly: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="build30" className="text-sm font-normal text-muted-foreground">
                      Buildable en &lt;30 jours
                    </Label>
                    <Switch
                      id="build30"
                      checked={filters.buildableUnder30}
                      onCheckedChange={(v) => setFilters((f) => ({ ...f, buildableUnder30: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="b2b" className="text-sm font-normal text-muted-foreground">
                      B2B uniquement
                    </Label>
                    <Switch
                      id="b2b"
                      checked={filters.b2bOnly}
                      onCheckedChange={(v) => setFilters((f) => ({ ...f, b2bOnly: v }))}
                    />
                  </div>
                </div>
              </div>

              <details className="group border-t border-border pt-4">
                <summary className="cursor-pointer list-none font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-1.5">
                    Critères avancés
                    <ChevronDown className="size-3 transition-transform group-open:rotate-180" aria-hidden />
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Complexité tech</Label>
                    <div className="mt-2 space-y-2">
                      {(["low", "medium", "high"] as TechComplexity[]).map((t) => (
                        <label key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Checkbox
                            checked={filters.techComplexity.includes(t)}
                            onCheckedChange={() =>
                              setFilters((f) => ({
                                ...f,
                                techComplexity: f.techComplexity.includes(t)
                                  ? f.techComplexity.filter((x) => x !== t)
                                  : [...f.techComplexity, t],
                              }))
                            }
                          />
                          {techLabels[t]}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Concurrence France</Label>
                    <div className="mt-2 space-y-2">
                      {(["none", "low", "medium", "high"] as FranceCompetition[]).map((c) => (
                        <label key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Checkbox
                            checked={filters.franceCompetition.includes(c)}
                            onCheckedChange={() =>
                              setFilters((f) => ({
                                ...f,
                                franceCompetition: f.franceCompetition.includes(c)
                                  ? f.franceCompetition.filter((x) => x !== c)
                                  : [...f.franceCompetition, c],
                              }))
                            }
                          />
                          {competitionLabels[c]}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Potentiel revenu min.</Label>
                    <select
                      className="mt-2 w-full rounded-lg border border-border px-3 py-2.5 text-base sm:text-sm"
                      value={filters.revenueMin}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, revenueMin: Number(e.target.value) }))
                      }
                    >
                      <option value={0}>Tous</option>
                      <option value={5000}>5 000€+/mois</option>
                      <option value={10000}>10 000€+/mois</option>
                      <option value={20000}>20 000€+/mois</option>
                    </select>
                  </div>
                </div>
              </details>

              {isFilterActive(filters) && (
                <Button variant="outline" size="sm" className="w-full" onClick={resetAllFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center sm:justify-between lg:mt-7">
              <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
                {resultLabel}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sort-results" className="shrink-0 font-data text-[10px] uppercase tracking-data text-muted-foreground">
                  Trier par
                </label>
                <select
                  id="sort-results"
                  className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-base sm:flex-none sm:text-sm"
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, sort: e.target.value as SortOption }))
                  }
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
                <SearchX className="mx-auto size-8 text-muted-foreground/60" aria-hidden />
                <p className="mt-3 font-medium">Aucun résultat</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {!discovery && filters.favoritesOnly
                    ? favoriteSlugs.length === 0
                      ? "Aucun favori — clique ♥ sur une fiche pour l'ajouter."
                      : "Aucune de vos fiches favorites ne correspond aux autres filtres."
                    : restrictiveLabels.length > 0
                      ? `Aucune fiche pour : ${restrictiveLabels.join(" · ")}.`
                      : "Essayez de retirer un filtre pour voir plus d'opportunités."}
                </p>
                <Button className="mt-4" variant="outline" onClick={resetAllFilters}>
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((o, i) => (
                  <OpportunityCard
                    key={o.id}
                    opportunity={o}
                    index={i}
                    isTopPick={topPickId === o.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
