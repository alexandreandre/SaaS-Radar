"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScoreGauge } from "@/components/scores/score-gauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Opportunity } from "@/types/opportunity";
import { sectorLabels } from "@/data/opportunities";
import { formatCurrency } from "@/lib/utils";
import { Bookmark, HelpCircle, Lock, Users } from "lucide-react";
import { useState } from "react";

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const [scenario, setScenario] = useState(1);
  const fin = opportunity.financialScenarios[scenario];
  const isPro = false;

  const gauges = [
    {
      label: "Opportunity",
      value: opportunity.scores.opportunity,
      max: 100,
      tooltip: "Potentiel global basé sur traction étrangère, taille de marché FR et facilité de monétisation.",
    },
    {
      label: "France Fit",
      value: opportunity.scores.franceFit,
      max: 10,
      tooltip: `Problème en FR: ${opportunity.franceFitCriteria.problemExists ? "Oui" : "Non"}. Régulation: ${opportunity.franceFitCriteria.regulation}. Concurrents: ${opportunity.franceFitCriteria.competitors}. Culture: ${opportunity.franceFitCriteria.cultureFit}`,
    },
    {
      label: "Buildability",
      value: opportunity.scores.buildability,
      max: 10,
      tooltip: "Facilité de construction avec Claude Code / stack moderne en <30-45 jours.",
    },
    {
      label: "Marge",
      value: opportunity.scores.margin,
      max: 10,
      tooltip: "Potentiel de marge brute après coûts infra et support.",
    },
    {
      label: "Competition Gap",
      value: opportunity.scores.competitionGap,
      max: 10,
      tooltip: "Écart concurrentiel — distingue « pas de concurrent » vs « pas de marché ».",
    },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/opportunities" className="text-sm text-muted-foreground hover:text-accent">
          ← Retour aux opportunités
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{opportunity.originFlag} {opportunity.originCountry}</span>
            <span>·</span>
            <span>{sectorLabels[opportunity.sector]}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{opportunity.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{opportunity.pitch}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {opportunity.boringBusiness && <Badge variant="success">Boring business ✓</Badge>}
            {opportunity.aiPowered && <Badge>AI-powered ✓</Badge>}
            {opportunity.buildableUnder30Days && <Badge variant="outline">Buildable &lt;30j ✓</Badge>}
            {opportunity.lowCompetition && <Badge variant="secondary">Low competition ✓</Badge>}
          </div>
        </header>

        <div className="mt-10 flex flex-wrap justify-center gap-6 sm:justify-between">
          {gauges.map((g, i) => (
            <ScoreGauge key={g.label} label={g.label} value={g.value} max={g.max} tooltip={g.tooltip} delay={i * 0.1} />
          ))}
        </div>

        <section className="mt-12 rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold">Signaux de traction</h2>
          <p className="mt-1 text-sm text-muted-foreground">Données sourcées — pas inventées</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {opportunity.tractionSignals.map((s) => (
              <div key={s.label} className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-xl font-semibold">{s.value}</p>
                <Badge variant="outline" className="mt-2">
                  {s.source}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Pourquoi ça marche</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-700">
            {opportunity.whyItWorks.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-border bg-zinc-50 p-6">
          <h2 className="text-lg font-semibold">Analyse adaptation France</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700">
            {opportunity.franceAnalysis.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">→</span>
                {p}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold">Projections financières</h2>
          <div className="mt-4 flex gap-2">
            {opportunity.financialScenarios.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setScenario(i)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  scenario === i ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Clients</th>
                <th className="pb-3 font-medium">Prix moy.</th>
                <th className="pb-3 font-medium">MRR</th>
                <th className="pb-3 font-medium">Marge brute</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 font-semibold">{fin.clients}</td>
                <td className="py-3">{formatCurrency(fin.avgPrice)}</td>
                <td className="py-3 font-semibold text-accent">{formatCurrency(fin.mrr)}</td>
                <td className="py-3">{fin.grossMargin}%</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-xs text-muted-foreground">
            Ces chiffres sont des estimations, pas des garanties.
          </p>
        </section>

        <section className="mt-8 rounded-xl border border-border bg-white p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">CAC par canal</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Coût d&apos;acquisition client estimé par canal. Utilisez le canal avec le meilleur ratio LTV/CAC pour votre ICP.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Canal</th>
                <th className="pb-2 font-medium">CAC estimé</th>
                <th className="pb-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {opportunity.cacChannels.map((c) => (
                <tr key={c.channel} className="border-b border-border last:border-0">
                  <td className="py-3">{c.channel}</td>
                  <td className="py-3 font-semibold">≈ {formatCurrency(c.estimate)}</td>
                  <td className="py-3 text-muted-foreground">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">MVP Plan</h2>
            {!isPro && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" /> Builder+
              </Badge>
            )}
          </div>
          <div className={!isPro ? "mt-4 select-none blur-sm" : "mt-4"}>
            <h3 className="text-sm font-medium">À construire (V1)</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-zinc-700">
              {opportunity.mvpPlan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-medium">À ne PAS construire encore</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-zinc-500">
              {opportunity.mvpPlan.notYet.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-medium">Stack recommandée</h3>
            <p className="mt-2 text-sm text-zinc-600">{opportunity.mvpPlan.stack.join(" · ")}</p>
            <h3 className="mt-4 text-sm font-medium">Roadmap 14 jours</h3>
            <div className="mt-2 space-y-2">
              {opportunity.mvpPlan.roadmap.map((r) => (
                <div key={r.day} className="rounded-lg bg-zinc-50 p-3 text-sm">
                  <span className="font-medium text-accent">{r.day}</span>
                  <span className="text-zinc-600"> — {r.tasks.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
          {!isPro && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Button asChild>
                <Link href="/dashboard">Débloquer avec Builder — 29€/mois</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="relative mt-8 overflow-hidden rounded-xl border border-border bg-zinc-900 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Claude Code Prompt</h2>
            {isPro ? (
              <CopyButton text={opportunity.claudePrompt} className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
            ) : (
              <Badge className="gap-1 bg-white/10 text-white">
                <Lock className="h-3 w-3" /> Pro
              </Badge>
            )}
          </div>
          <pre className={`mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-300 ${!isPro ? "blur-sm" : ""}`}>
            {opportunity.claudePrompt}
          </pre>
          {!isPro && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button asChild>
                <Link href="/dashboard">Passer Pro — 79€/mois</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold">Stratégie d&apos;acquisition</h2>
          <Tabs defaultValue={opportunity.acquisition[0]?.id} className="mt-4">
            <TabsList>
              {opportunity.acquisition.map((a) => (
                <TabsTrigger key={a.id} value={a.id}>
                  {a.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {opportunity.acquisition.map((a) => (
              <TabsContent key={a.id} value={a.id}>
                <ul className="space-y-3">
                  {a.tactics.map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                        {i + 1}
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-accent-muted/30 p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Déjà en cours de build par {opportunity.entrepreneursBuilding} entrepreneurs
          </div>
          <Button variant="outline" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Ajouter à la watchlist
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Inspiré par {opportunity.foreignInspiration}
        </p>
      </main>
      <Footer />
    </>
  );
}
