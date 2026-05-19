"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { Button } from "@/components/ui/button";
import { opportunities } from "@/data/opportunities";
import { getGlobalStats } from "@/data/world-markets";
import { Check, X, Globe2 } from "lucide-react";
import { useState } from "react";
import { HomeMapGateway } from "@/components/world/home-map-gateway";

const feedPreview = opportunities.filter((o) => !o.weeklyPick).slice(0, 8);

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
    features: ["3 opportunités/mois", "Scores de base", "Pick de la semaine"],
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
  const mapStats = getGlobalStats();
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const filtered =
    sectorFilter === "all"
      ? feedPreview
      : feedPreview.filter((o) => o.sector === sectorFilter);

  return (
    <>
      <section className="relative min-h-[min(100dvh,920px)] overflow-hidden bg-[#0A0A0A] text-white">
        <HomeMapGateway />

        <div className="relative z-10 flex min-h-[min(100dvh,920px)] flex-col pointer-events-none">
          <div className="pointer-events-auto">
            <Navbar dark />
          </div>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none max-w-xl"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Globe2 className="h-3.5 w-3.5" />
                {mapStats.countriesTracked} pays · intelligence mondiale
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Où naissent les micro-SaaS{" "}
                <span className="text-zinc-500">que vous pouvez importer.</span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-zinc-400">
                La carte révèle les marchés chauds, les top revenus et le fit d&apos;import vers votre pays cible.
                Survolez, cliquez, lancez.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
                <span>
                  <strong className="text-white">{mapStats.countriesTracked}</strong> pays indexés
                </span>
                <span>
                  <strong className="text-white">
                    {mapStats.totalMicroSaas.toLocaleString("fr-FR")}
                  </strong>{" "}
                  micro-SaaS trackés
                </span>
                <span>
                  Plus chaud :{" "}
                  <strong className="text-accent">
                    {mapStats.hottestMarket.flag} {mapStats.hottestMarket.name}
                  </strong>
                </span>
              </div>

              <p className="mt-8 text-sm text-zinc-500">
                <span className="text-zinc-400">→</span> Cliquez sur la carte pour zoomer et explorer
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Flux en direct</h2>
              <p className="mt-1 text-muted-foreground">12 opportunités analysées cette semaine</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "Tous" },
                { id: "healthcare", label: "Santé" },
                { id: "construction", label: "BTP" },
                { id: "finance", label: "Finance" },
                { id: "legal", label: "Juridique" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSectorFilter(s.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    sectorFilter === s.id ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {filtered.map((o, i) => (
              <OpportunityCard key={o.id} opportunity={o} index={i} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/opportunities">Voir les 12 opportunités →</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-zinc-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Pourquoi ça bat une formation à 3 000€
          </h2>
          <div className="mt-10 overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-zinc-50">
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Critère</th>
                  <th className="px-6 py-4 text-center font-semibold text-accent">SaaS Radar</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">Formation classique</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border last:border-0">
                    <td className="px-6 py-4">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.us === "boolean" ? (
                        row.us ? <Check className="mx-auto h-5 w-5 text-accent" /> : <X className="mx-auto h-5 w-5 text-zinc-300" />
                      ) : (
                        <span className="font-semibold text-accent">{row.us}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.training === "boolean" ? (
                        row.training ? <Check className="mx-auto h-5 w-5 text-zinc-400" /> : <X className="mx-auto h-5 w-5 text-zinc-300" />
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

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-4xl font-semibold tabular-nums text-accent">127</p>
          <p className="mt-2 text-lg text-muted-foreground">entrepreneurs ont lancé ce mois-ci</p>
        </div>
      </section>

      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Tarifs simples</h2>
          <p className="mt-2 text-center text-muted-foreground">Annulez quand vous voulez. Pas de frais cachés.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border bg-white p-6 ${
                  plan.highlight ? "border-accent shadow-card-hover ring-1 ring-accent" : "border-border"
                }`}
              >
                {plan.highlight && (
                  <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">
                    Populaire
                  </span>
                )}
                <h3 className="mt-4 text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-3xl font-semibold">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">/mois</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-accent" />
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
