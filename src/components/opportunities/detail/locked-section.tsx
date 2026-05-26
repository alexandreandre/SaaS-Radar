import Link from "next/link";
import { Lock } from "lucide-react";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface LockedSectionProps {
  id: string;
  number: number;
  title: string;
  plan: "BUILDER" | "PRO";
  description: string;
  preview: string;
  teaser: string;
  animationIndex: number;
}

export function LockedSection({
  id,
  number,
  title,
  plan,
  description,
  preview,
  teaser,
  animationIndex,
}: LockedSectionProps) {
  return (
    <AnimatedSection id={id} animationIndex={animationIndex} className="relative mb-12 scroll-mt-24">
      <SectionTitle number={number} title={title} locked plan={plan} />

      <div className="relative mt-4 overflow-hidden rounded-xl">
        <p className="mb-3 text-sm italic text-gray-400">{teaser}</p>
        <div className="pointer-events-none select-none rounded-xl border border-gray-800 bg-gray-900 p-6 opacity-80 blur-[2px]">
          <p className="mb-3 text-sm text-gray-300">{description}</p>
          <p className="whitespace-pre-line text-sm text-gray-400">{preview}</p>
          <div className="mt-4 h-4 w-3/4 rounded bg-gray-700" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-700" />
          <div className="mt-2 h-4 w-2/3 rounded bg-gray-700" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gray-950/40">
          <Lock className="mb-2 h-6 w-6 text-gray-400" />
          <p className="mb-1 text-sm font-semibold text-white">Section réservée aux abonnés</p>
          <p className="mb-4 text-xs text-gray-400">Abonnement {plan} requis</p>
          <Link
            href="#paywall"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Débloquer — 29€/mois
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
}
