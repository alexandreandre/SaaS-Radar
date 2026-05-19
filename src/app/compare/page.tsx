"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { opportunities } from "@/data/opportunities";
import { ScoreBars } from "@/components/scores/score-bars";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/types/opportunity";

function aiVerdict(a: Opportunity): string {
  const s = a.scores;
  if (s.opportunity >= 85 && s.buildability >= 8) {
    return `Priorité haute : ${a.name.split(" ")[0]} combine traction prouvée et build rapide.`;
  }
  if (s.margin >= 8.5) {
    return `Excellent modèle économique — idéal si vous avez déjà un réseau dans ${a.targetClient.split("(")[0].trim()}.`;
  }
  if (s.competitionGap >= 8) {
    return `Fenêtre ouverte : peu de concurrents en France, mais validez le marché avant d'investir.`;
  }
  return `Opportunité solide mais exige plus de temps — bon choix si vous maîtrisez déjà le secteur.`;
}

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([
    opportunities[0].slug,
    opportunities[2].slug,
    opportunities[4].slug,
  ]);

  const cols = selected
    .map((slug) => opportunities.find((o) => o.slug === slug))
    .filter(Boolean) as Opportunity[];

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      setSelected(selected.filter((s) => s !== slug));
    } else if (selected.length < 3) {
      setSelected([...selected, slug]);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Comparateur d&apos;idées</h1>
        <p className="mt-2 text-muted-foreground">Comparez jusqu&apos;à 3 opportunités côte à côte</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {opportunities.map((o) => (
            <Button
              key={o.slug}
              size="sm"
              variant={selected.includes(o.slug) ? "default" : "outline"}
              onClick={() => toggle(o.slug)}
              disabled={!selected.includes(o.slug) && selected.length >= 3}
            >
              {o.name.length > 35 ? o.name.slice(0, 35) + "…" : o.name}
            </Button>
          ))}
        </div>

        {cols.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">Sélectionnez au moins une opportunité</p>
        ) : (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th className="w-40 pb-4 text-left font-medium text-muted-foreground" />
                  {cols.map((o) => (
                    <th key={o.slug} className="px-4 pb-4 text-left font-semibold">
                      {o.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row label="Scores">
                  {cols.map((o) => (
                    <td key={o.slug} className="px-4 py-4 align-top">
                      <ScoreBars scores={o.scores} compact />
                    </td>
                  ))}
                </Row>
                <Row label="MRR réaliste">
                  {cols.map((o) => (
                    <td key={o.slug} className="px-4 py-3 font-semibold text-accent">
                      {formatCurrency(o.financialScenarios[1].mrr)}
                    </td>
                  ))}
                </Row>
                <Row label="Buildability">
                  {cols.map((o) => (
                    <td key={o.slug} className="px-4 py-3">
                      {o.scores.buildability}/10 · {o.buildableUnder30Days ? "<30 jours" : "30-45 jours"}
                    </td>
                  ))}
                </Row>
                <Row label="Complexité tech">
                  {cols.map((o) => (
                    <td key={o.slug} className="px-4 py-3 capitalize">
                      {o.techComplexity === "low" ? "Faible" : o.techComplexity === "medium" ? "Moyenne" : "Élevée"}
                    </td>
                  ))}
                </Row>
                <Row label="Potentiel revenu">
                  {cols.map((o) => (
                    <td key={o.slug} className="px-4 py-3">
                      {formatCurrency(o.revenueMin)}–{formatCurrency(o.revenueMax)}
                    </td>
                  ))}
                </Row>
                <tr className="border-t-2 border-accent bg-accent-muted/20">
                  <td className="py-4 font-semibold">Verdict IA</td>
                  {cols.map((o) => (
                    <td key={o.slug} className="px-4 py-4 text-sm leading-relaxed">
                      {aiVerdict(o)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-border">
      <td className="py-3 font-medium text-muted-foreground">{label}</td>
      {children}
    </tr>
  );
}
