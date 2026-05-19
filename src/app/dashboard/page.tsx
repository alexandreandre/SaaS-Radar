"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getDealOfTheWeek, opportunities } from "@/data/opportunities";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

const milestones = [
  { id: "landing", label: "Landing créée", done: true },
  { id: "email", label: "Premier email envoyé", done: true },
  { id: "prospect", label: "Premier prospect", done: false },
  { id: "demo", label: "Première démo", done: false },
  { id: "client", label: "Premier client payant", done: false },
];

const watchlist = [
  { ...opportunities[1], delta: "Nouveau concurrent FR détecté", trend: "down" as const },
  { ...opportunities[3], delta: "Score Opportunity +3", trend: "up" as const },
  { ...opportunities[9], delta: "Stable", trend: "up" as const },
];

export default function DashboardPage() {
  const [signedIn] = useState(true);
  const building = getDealOfTheWeek();
  const fin = building.financialScenarios[1];
  const [checks, setChecks] = useState(milestones);

  if (!signedIn) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold">Connectez-vous</h1>
          <p className="mt-2 text-muted-foreground">Accédez à votre journal de lancement</p>
          <Button className="mt-6" onClick={() => {}}>
            Se connecter (mock)
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Bonjour, Alex 👋</p>
            <h1 className="text-2xl font-semibold tracking-tight">Votre tableau de bord</h1>
          </div>
          <BadgeMock>Plan Builder</BadgeMock>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl border border-border bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">En cours de build</p>
              <h2 className="mt-2 text-xl font-semibold">{building.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{building.targetClient}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">MRR cible (réaliste)</p>
                  <p className="text-lg font-semibold text-accent">{formatCurrency(fin.mrr)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Score global</p>
                  <p className="text-lg font-semibold">{building.scores.opportunity}/100</p>
                </div>
              </div>
              <Button className="mt-4" variant="outline" size="sm" asChild>
                <Link href={`/opportunities/${building.slug}`}>Voir le plan complet</Link>
              </Button>
            </section>

            <section className="rounded-xl border border-border bg-white p-6">
              <h2 className="font-semibold">Journal de lancement</h2>
              <div className="mt-4 space-y-3">
                {checks.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-zinc-50">
                    <Checkbox
                      checked={m.done}
                      onCheckedChange={(v) =>
                        setChecks((prev) =>
                          prev.map((x) => (x.id === m.id ? { ...x, done: !!v } : x))
                        )
                      }
                    />
                    <span className={m.done ? "text-muted-foreground line-through" : ""}>{m.label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-accent/30 bg-accent-muted/40 p-6">
              <p className="text-xs font-medium text-accent">Prochaine action IA</p>
              <p className="mt-2 text-sm leading-relaxed">
                Envoyez 10 cold emails à des cabinets dentaires de Lyon avec le template « RDV manqués » — votre landing est prête, il est temps de valider l&apos;intérêt.
              </p>
              <Button className="mt-4 w-full gap-2" size="sm">
                Voir le template email
                <ArrowRight className="h-4 w-4" />
              </Button>
            </section>

            <section className="rounded-xl border border-border bg-white p-6">
              <h2 className="font-semibold">Watchlist</h2>
              <ul className="mt-4 space-y-4">
                {watchlist.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/opportunities/${o.slug}`} className="group block">
                      <p className="text-sm font-medium group-hover:text-accent">{o.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {o.trend === "up" ? (
                          <TrendingUp className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-amber-600" />
                        )}
                        {o.delta}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function BadgeMock({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">{children}</span>
  );
}