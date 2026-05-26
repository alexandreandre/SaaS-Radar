"use client";

import Link from "next/link";
import { CheckCircle, Lock } from "lucide-react";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

const paywallItems = [
  { text: "Le SaaS tel qu'il existe aux US", sub: "Fonctionnalités, pricing, traction réelle" },
  { text: "Potentiel financier détaillé", sub: "Scénarios Prudent / Réaliste / Optimiste" },
  { text: "Stratégie d'acquisition France", sub: "Canaux, coûts, templates emails" },
  { text: "Guide J1 → J14", sub: "Exactement ce qu'il faut faire chaque jour" },
];

export function DetailPaywall() {
  return (
    <AnimatedSection
      id="paywall"
      animationIndex={9}
      className="mb-12 scroll-mt-24 rounded-2xl border border-gray-700 bg-gray-900 p-8 text-center"
    >
      <Lock className="mx-auto mb-4 h-8 w-8 text-gray-400" />
      <h3 className="mb-2 text-xl font-bold text-white">Vous venez de voir pourquoi ça marche.</h3>
      <p className="mb-6 text-gray-400">La suite, c&apos;est comment le faire.</p>

      <div className="mx-auto mb-6 max-w-sm space-y-3 text-left">
        {paywallItems.map((item) => (
          <div key={item.text} className="flex gap-3">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-white">{item.text}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard"
        className="mx-auto mb-3 block w-full max-w-sm rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
      >
        Débloquer ce guide — 29€/mois →
      </Link>

      <div className="mx-auto mb-3 max-w-sm rounded-lg bg-gray-800 p-3">
        <p className="text-sm text-yellow-400">★★★★★</p>
        <p className="text-xs italic text-gray-300">&quot;J&apos;ai lancé en 11 jours grâce au guide&quot;</p>
        <p className="text-xs text-gray-500">— Thomas R., Bordeaux · Abonné Builder</p>
      </div>

      <Link
        href="/dashboard"
        className="inline-block rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-gray-500"
      >
        Abonnement Pro — 79€/mois (inclut Prompt Claude Code)
      </Link>
    </AnimatedSection>
  );
}
