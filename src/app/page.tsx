"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { Button } from "@/components/ui/button";
import { opportunities } from "@/data/opportunities";
import { getPresentSectorChips, getSectorFilterKey } from "@/data/sectors";
import { SectorSearchPicker } from "@/components/opportunities/sector-search-picker";
import { getGlobalStats } from "@/data/world-markets";
import { Check, X } from "lucide-react";
import { HomeMapGateway } from "@/components/world/home-map-gateway";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "@/components/opportunities/countdown-timer";
import { MAP_EXPLORE_QUERY, MAP_EXPLORE_VALUE } from "@/lib/map-routes";

const analystFeed = opportunities.filter((o) => !o.weeklyPick);
const feedPreview = analystFeed.slice(0, 8);
const analystTotal = analystFeed.length;
const sectorChips = getPresentSectorChips(feedPreview.map((o) => o.sector));

const chipClass = (active: boolean) =>
  cn(
    "rounded-sm px-3 py-1.5 font-data text-[10px] font-medium uppercase tracking-data transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
  );

const comparison = [
  { feature: "Opportunités validées à l'étranger", us: true, training: false },
  { feature: "Scores France Fit + Buildability", us: true, training: false },
  { feature: "Projections financières par scénario", us: true, training: false },
  { feature: "Prompt Claude Code prêt à l'emploi", us: true, training: false },
  { feature: "CAC par canal (chiffres réels)", us: true, training: false },
  { feature: "Mise à jour hebdomadaire", us: true, training: false },
  { feature: "Contenu générique « entrepreneuriat »", us: false, training: true },
  { feature: "Prix", us: "29€/mois", training: "3 000€+" },
];

const pricing = [
  {
    name: "Free",
    price: "0€",
    desc: "Découvrez le potentiel",
    features: ["3 opportunités/mois", "Scores de base", "Newsletter quotidienne"],
    cta: "Commencer gratuit",
    highlight: false,
  },
  {
    name: "Builder",
    price: "29€",
    desc: "Pour lancer votre MVP",
    features: ["Toutes les opportunités", "MVP Plan + stack", "Simulateur financier", "Comparateur 3 idées"],
    cta: "Devenir Builder",
    highlight: true,
  },
  {
    name: "Pro",
    price: "79€",
    desc: "Pour scaler vite",
    features: ["Prompt Claude Code", "Acquisition par canal", "Watchlist + alertes", "Journal de lancement"],
    cta: "Passer Pro",
    highlight: false,
  },
];

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageFallback() {
  const mapStats = getGlobalStats();
  return (
    <>
      <section className="relative min-h-[min(100dvh,920px)] overflow-hidden bg-hero text-hero-foreground">
        <div className="absolute inset-0 z-0 radar-grid opacity-30" />
        <div className="relative z-[60] flex min-h-[min(100dvh,920px)] flex-col">
          <Navbar dark />
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20">
            <p className="label-data text-map-muted">Intelligence micro-SaaS · France</p>
            <p className="mt-4 font-data text-xs uppercase tracking-data text-map-muted">
              {mapStats.countriesTracked} pays indexés
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapStats = getGlobalStats();
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [mapUnlocked, setMapUnlocked] = useState(false);

  const exploreParam = searchParams.get(MAP_EXPLORE_QUERY);

  useEffect(() => {
    const explore = exploreParam === MAP_EXPLORE_VALUE;
    setMapUnlocked(explore);
    if (explore) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [exploreParam]);

  const handleMapUnlock = useCallback(() => {
    setMapUnlocked(true);
    if (exploreParam !== MAP_EXPLORE_VALUE) {
      router.replace(`/?${MAP_EXPLORE_QUERY}=${MAP_EXPLORE_VALUE}`, { scroll: false });
    }
  }, [exploreParam, router]);

  const handleMapLock = useCallback(() => {
    setMapUnlocked(false);
    if (exploreParam === MAP_EXPLORE_VALUE) {
      router.replace("/", { scroll: false });
    }
  }, [exploreParam, router]);

  const filterKey = getSectorFilterKey(sectorFilter);

  const filtered = useMemo(
    () =>
      filterKey === "all" ? feedPreview : feedPreview.filter((o) => o.sector === filterKey),
    [filterKey]
  );

  const topPickId = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((best, o) =>
      o.scores.opportunity > best.scores.opportunity ? o : best
    ).id;
  }, [filtered]);

  const archivedCount = Math.max(0, analystTotal - feedPreview.length);

  return (
    <>
      <section className="relative min-h-[min(100dvh,920px)] overflow-hidden bg-hero text-hero-foreground">
        <div className="absolute inset-0 z-0 radar-grid opacity-30" />
        <div className="absolute inset-0 z-0">
          <HomeMapGateway
            unlocked={mapUnlocked}
            onUnlock={handleMapUnlock}
            onLock={handleMapLock}
          />
        </div>

        <div className="pointer-events-none relative z-[60] flex min-h-[min(100dvh,920px)] flex-col">
          <div className="pointer-events-auto">
            <Navbar dark />
          </div>

          <AnimatePresence>
            {!mapUnlocked && (
              <motion.div
                key="landing-copy"
                initial={false}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className="pointer-events-none mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20"
              >
                <div className="max-w-xl">
                  <p className="label-data text-map-muted">Intelligence micro-SaaS · France</p>
                  <h1 className="mt-4 text-balance font-display text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                    Où naissent les micro-SaaS{" "}
                    <span className="text-map-muted">que vous pouvez importer.</span>
                  </h1>
                  <p className="mt-5 text-lg leading-relaxed text-map-muted">
                    La carte révèle les marchés chauds, les top revenus et le fit d&apos;import vers votre
                    pays cible. Survolez, cliquez, décidez.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-data text-xs uppercase tracking-data text-map-muted">
                    <span>
                      <strong className="text-hero-foreground tabular-nums">{mapStats.countriesTracked}</strong>{" "}
                      pays indexés
                    </span>
                    <span>
                      <strong className="text-hero-foreground tabular-nums">
                        {mapStats.totalMicroSaas.toLocaleString("fr-FR")}
                      </strong>{" "}
                      micro-SaaS trackés
                    </span>
                    <span>
                      Plus chaud :{" "}
                      <strong className="text-primary">
                        {mapStats.hottestMarket.flag} {mapStats.hottestMarket.name}
                      </strong>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="border-b border-border bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div>
            <p className="label-data">Flux analyste</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-8">
              <h2 className="font-display text-2xl font-medium tracking-tight">Opportunités cette semaine</h2>
              <CountdownTimer variant="weekEnd" />
            </div>
          </div>

          <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex min-w-max flex-wrap items-center gap-1.5 sm:min-w-0">
              <button
                type="button"
                onClick={() => setSectorFilter("all")}
                className={chipClass(sectorFilter === "all")}
              >
                Tous · {feedPreview.length}
              </button>
              {sectorChips.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSectorFilter(s.id)}
                  className={chipClass(sectorFilter === s.id)}
                >
                  {s.label}
                </button>
              ))}
              <SectorSearchPicker
                value={sectorFilter}
                onChange={setSectorFilter}
                chipClass={chipClass}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {filtered.length > 0 ? (
              filtered.map((o, i) => (
                <OpportunityCard
                  key={o.id}
                  opportunity={o}
                  index={i}
                  isTopPick={topPickId === o.id}
                />
              ))
            ) : (
              <p className="col-span-full rounded-lg border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
                Aucune opportunité dans ce secteur pour l&apos;aperçu —{" "}
                <Link href="/opportunities" className="font-medium text-primary hover:underline">
                  voir toutes les fiches
                </Link>
                .
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <Button size="lg" asChild>
              <Link href="/opportunities">
                Voir les {analystTotal} opportunités →
              </Link>
            </Button>
            {archivedCount > 0 && (
              <p className="text-sm text-muted-foreground">
                + {archivedCount} archivées dans la base analyste
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="label-data text-center">Comparatif</p>
          <h2 className="mt-2 text-center font-display text-2xl font-medium tracking-tight">
            Pourquoi ça bat une formation à 3 000€
          </h2>
          <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Critère</th>
                  <th className="px-6 py-4 text-center font-semibold text-primary">SaaS Radar</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">Formation classique</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border last:border-0">
                    <td className="px-6 py-4">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.us === "boolean" ? (
                        row.us ? (
                          <Check className="mx-auto h-5 w-5 text-primary" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
                        )
                      ) : (
                        <span className="font-data font-semibold tabular-nums text-primary">{row.us}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.training === "boolean" ? (
                        row.training ? (
                          <Check className="mx-auto h-5 w-5 text-muted-foreground" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
                        )
                      ) : (
                        <span className="text-muted-foreground">{row.training}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="font-display text-5xl font-medium tabular-nums text-foreground">127</p>
          <p className="mt-2 text-muted-foreground">entrepreneurs ont lancé ce mois-ci</p>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="label-data text-center">Tarifs</p>
          <h2 className="mt-2 text-center font-display text-2xl font-medium tracking-tight">Simples, sans surprise</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Annulez quand vous voulez.</p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-lg border bg-card p-6 shadow-card",
                  plan.highlight ? "border-primary shadow-card-hover ring-1 ring-primary" : "border-border"
                )}
              >
                {plan.highlight && (
                  <span className="rounded-sm bg-accent px-2 py-0.5 font-data text-[10px] font-medium uppercase tracking-data text-accent-foreground">
                    Populaire
                  </span>
                )}
                <h3 className="mt-4 text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 font-display text-3xl font-medium tabular-nums">
                  {plan.price}
                  <span className="text-base font-sans font-normal text-muted-foreground">/mois</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 w-full" variant={plan.highlight ? "default" : "outline"} asChild>
                  <Link href="/dashboard">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
