"use client";

import { useMemo, useState } from "react";
import type { Opportunity } from "@/types/opportunity";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

function simulateMrr(
  months: number,
  price: number,
  churnPct: number,
  newCustomers: number
) {
  const churn = churnPct / 100;
  let active = 0;
  const data: { month: number; mrr: number; customers: number }[] = [];

  for (let m = 1; m <= months; m++) {
    active = Math.round(active * (1 - churn) + newCustomers);
    const mrr = active * price;
    data.push({ month: m, mrr, customers: active });
  }
  return data;
}

function computeBreakEvenMonth(
  data: { mrr: number }[],
  cac: number,
  newCustomers: number,
  costs: number
): number | null {
  let cumulative = -cac * newCustomers;
  for (let i = 0; i < data.length; i++) {
    cumulative += data[i].mrr - costs - cac * newCustomers;
    if (cumulative >= 0) return i + 1;
  }
  return null;
}

export function OpportunitySimulator({ opportunity }: { opportunity: Opportunity }) {
  const realisticScenario = opportunity.financialScenarios.find((s) => s.name === "Réaliste");

  const [price, setPrice] = useState(realisticScenario?.avgPrice ?? 79);
  const [churn, setChurn] = useState(5);
  const [cac, setCac] = useState(opportunity.cacChannels[0]?.estimate ?? 120);
  const [newClients, setNewClients] = useState(
    realisticScenario ? Math.round(realisticScenario.clients / 12) : 8
  );
  const [costs, setCosts] = useState(200);

  const resetToDefaults = () => {
    setPrice(realisticScenario?.avgPrice ?? 79);
    setChurn(5);
    setCac(opportunity.cacChannels[0]?.estimate ?? 120);
    setNewClients(realisticScenario ? Math.round(realisticScenario.clients / 12) : 8);
    setCosts(200);
  };

  const data12 = useMemo(
    () => simulateMrr(12, price, churn, newClients),
    [price, churn, newClients]
  );

  const data24 = useMemo(
    () => simulateMrr(24, price, churn, newClients),
    [price, churn, newClients]
  );

  const mrr12 = data12[11]?.mrr ?? 0;
  const clients12 = data12[11]?.customers ?? 0;
  const ltv = price / (churn / 100);
  const ltvcac = ltv / cac;
  const breakEven = computeBreakEvenMonth(data24, cac, newClients, costs);

  return (
    <AnimatedSection id="simulateur" animationIndex={2} className="mb-12 scroll-mt-24">
      <SectionTitle number={3} title="Simuler mon MRR 📈" />
      <p className="mb-4 flex items-center gap-1.5 text-xs text-gray-600">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
        Pré-rempli avec les données de
        <span className="ml-1 text-gray-400">{opportunity.foreignInspiration}</span>
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex justify-between">
              <label className="text-sm text-gray-400">Prix / mois</label>
              <span className="text-sm font-semibold text-white">{price}€</span>
            </div>
            <input
              type="range"
              min={9}
              max={499}
              step={1}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-600">
              <span>9€</span>
              <span>499€</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex justify-between">
              <label className="text-sm text-gray-400">Nouveaux clients / mois</label>
              <span className="text-sm font-semibold text-white">{newClients}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={newClients}
              onChange={(e) => setNewClients(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="mb-2 flex justify-between">
              <label className="text-sm text-gray-400">Churn mensuel</label>
              <span className="text-sm font-semibold text-white">{churn}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={churn}
              onChange={(e) => setChurn(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="mb-2 flex justify-between">
              <label className="text-sm text-gray-400">CAC (coût acquisition client)</label>
              <span className="text-sm font-semibold text-white">{cac}€</span>
            </div>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={cac}
              onChange={(e) => setCac(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={resetToDefaults}
            className="text-xs text-gray-600 transition-colors hover:text-gray-400"
          >
            ↺ Réinitialiser avec les données de l&apos;opportunité
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="mb-1 text-xs text-gray-500">MRR estimé à 12 mois</p>
            <p className="text-4xl font-black text-green-400">
              {Math.round(mrr12).toLocaleString("fr-FR")}€
            </p>
            <p className="mt-1 text-xs text-gray-600">/mois</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="mb-1 text-xs text-gray-500">Break-even</p>
              <p className="text-xl font-bold text-white">
                {breakEven ? `Mois ${breakEven}` : "24+ mois"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="mb-1 text-xs text-gray-500">LTV / CAC</p>
              <p
                className={cn(
                  "text-xl font-bold",
                  ltvcac >= 3 ? "text-green-400" : "text-yellow-400"
                )}
              >
                {ltvcac.toFixed(1)}x
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="mb-1 text-xs text-gray-500">Clients à 12 mois</p>
              <p className="text-xl font-bold text-white">{clients12}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="mb-1 text-xs text-gray-500">Revenu annuel</p>
              <p className="text-xl font-bold text-blue-400">
                {Math.round(mrr12 * 12).toLocaleString("fr-FR")}€
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-800/30 bg-blue-950/20 p-4">
            <p className="mb-3 text-sm text-gray-300">
              Ces chiffres vous motivent ? Le guide complet vous explique exactement comment les
              atteindre.
            </p>
            <a
              href="#paywall"
              className="block w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Voir le guide complet — 29€/mois →
            </a>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
