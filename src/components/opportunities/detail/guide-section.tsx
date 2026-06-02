import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface GuideSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

export function GuideSection({ opportunity, animationIndex }: GuideSectionProps) {
  const { mvpPlan } = opportunity;
  const lastIndex = mvpPlan.roadmap.length - 1;

  return (
    <AnimatedSection id="guide" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={9} title="Guide J1 → J14" />
      <p className="text-sm text-gray-500 mb-6">
        Exactement quoi faire chaque jour — de l&apos;idée au premier client payant
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl text-center">
          <p className="text-2xl font-black text-white">14</p>
          <p className="text-xs text-gray-500 mt-1">jours</p>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl text-center">
          <p className="text-2xl font-black text-green-400">{mvpPlan.features.length}</p>
          <p className="text-xs text-gray-500 mt-1">features MVP</p>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl text-center">
          <p className="text-2xl font-black text-blue-400">5</p>
          <p className="text-xs text-gray-500 mt-1">premiers clients</p>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-800" />

        <div className="space-y-4">
          {mvpPlan.roadmap.map((step, i) => (
            <div key={`${step.day}-${i}`} className="relative flex gap-4 pl-12">
              <div
                className={cn(
                  "absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 shrink-0",
                  i === 0
                    ? "bg-green-500 border-green-500"
                    : i === lastIndex
                      ? "bg-blue-500 border-blue-500"
                      : "bg-gray-700 border-gray-600"
                )}
              />

              <div className="flex-1 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    {step.day}
                  </span>
                  {i === 0 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      Démarrage
                    </span>
                  )}
                  {i === lastIndex && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                      Lancement
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {step.tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-gray-600 mt-1 shrink-0">→</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">✅ Ce que tu construis</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mvpPlan.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-green-400 shrink-0">✓</span>
              {feature}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          🚫 Ce qu&apos;on ne construit PAS au J1
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mvpPlan.notYet.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-gray-600 shrink-0">✗</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-gradient-to-r from-blue-950/40 to-gray-900 border border-blue-800/30 rounded-xl text-center">
        <p className="text-white font-semibold mb-1">Tu as tout ce qu&apos;il faut pour démarrer.</p>
        <p className="text-gray-400 text-sm mb-4">
          Le prompt Claude Code + ce guide = ton MVP en 14 jours.
        </p>
        <Link
          href="/pricing"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Accéder à toutes les opportunités →
        </Link>
      </div>
    </AnimatedSection>
  );
}
