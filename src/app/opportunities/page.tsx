"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { DealOfWeekCard } from "@/components/opportunities/deal-of-week";
import { opportunities, getDealOfTheWeek, sectorLabels } from "@/data/opportunities";
import { defaultFilters, filterOpportunities, type FilterState, type SortOption } from "@/lib/filters";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { Sector, TechComplexity, FranceCompetition } from "@/types/opportunity";
import { Search } from "lucide-react";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "opportunity", label: "Top Opportunity Score" },
  { value: "newest", label: "Plus récent" },
  { value: "buildability", label: "Plus facile à construire" },
  { value: "margin", label: "Marge la plus haute" },
];

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<OpportunitiesFallback />}>
      <OpportunitiesContent />
    </Suspense>
  );
}

function OpportunitiesFallback() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-muted-foreground">Chargement des opportunités…</p>
      </main>
      <Footer />
    </>
  );
}

function OpportunitiesContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const deal = getDealOfTheWeek();

  useEffect(() => {
    const country = searchParams.get("country");
    if (country) {
      setFilters((f) => ({ ...f, countryCode: country.toUpperCase() }));
    }
  }, [searchParams]);

  const filtered = useMemo(() => filterOpportunities(opportunities, filters), [filters]);
  const rest = filtered.filter((o) => o.slug !== deal.slug);

  const toggleSector = (s: Sector) => {
    setFilters((f) => ({
      ...f,
      sectors: f.sectors.includes(s) ? f.sectors.filter((x) => x !== s) : [...f.sectors, s],
    }));
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Opportunités</h1>
          <p className="mt-2 text-muted-foreground">
            {opportunities.length} micro-SaaS analysés pour le marché français
            {filters.countryCode && (
              <span className="ml-2 inline-flex items-center rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
                Pays : {filters.countryCode}
                <button
                  type="button"
                  className="ml-1.5 hover:opacity-70"
                  onClick={() => setFilters((f) => ({ ...f, countryCode: null }))}
                  aria-label="Retirer le filtre pays"
                >
                  ×
                </button>
              </span>
            )}
          </p>
        </div>

        <DealOfWeekCard opportunity={deal} />

        <div className="mt-12 flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="sticky top-24 space-y-6 rounded-xl border border-border bg-white p-5">
              <div>
                <Label>Recherche</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Nom, client cible..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <Label>Secteur</Label>
                <div className="mt-2 space-y-2">
                  {(Object.keys(sectorLabels) as Sector[]).map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={filters.sectors.includes(s)}
                        onCheckedChange={() => toggleSector(s)}
                      />
                      {sectorLabels[s]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Complexité tech</Label>
                <div className="mt-2 space-y-2">
                  {(["low", "medium", "high"] as TechComplexity[]).map((t) => (
                    <label key={t} className="flex items-center gap-2 text-sm">
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
                      {t === "low" ? "Faible" : t === "medium" ? "Moyenne" : "Élevée"}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Concurrence France</Label>
                <div className="mt-2 space-y-2">
                  {(["none", "low", "medium", "high"] as FranceCompetition[]).map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm">
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
                      {c === "none" ? "Aucune" : c === "low" ? "Faible" : c === "medium" ? "Moyenne" : "Forte"}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Potentiel revenu min.</Label>
                <select
                  className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={filters.revenueMin}
                  onChange={(e) => setFilters((f) => ({ ...f, revenueMin: Number(e.target.value) }))}
                >
                  <option value={0}>Tous</option>
                  <option value={5000}>5 000€+/mois</option>
                  <option value={10000}>10 000€+/mois</option>
                  <option value={20000}>20 000€+/mois</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="build30">Buildable en &lt;30 jours</Label>
                <Switch
                  id="build30"
                  checked={filters.buildableUnder30}
                  onCheckedChange={(v) => setFilters((f) => ({ ...f, buildableUnder30: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="b2b">B2B uniquement</Label>
                <Switch
                  id="b2b"
                  checked={filters.b2bOnly}
                  onCheckedChange={(v) => setFilters((f) => ({ ...f, b2bOnly: v }))}
                />
              </div>

              <div>
                <Label>Trier par</Label>
                <select
                  className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={filters.sort}
                  onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortOption }))}
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {rest.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-zinc-50 p-12 text-center">
                <p className="font-medium">Aucun résultat</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Essayez de retirer un filtre pour voir plus d&apos;opportunités.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setFilters(defaultFilters)}>
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {rest.map((o, i) => (
                  <OpportunityCard key={o.id} opportunity={o} index={i} />
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