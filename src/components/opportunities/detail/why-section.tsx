"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types/opportunity";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface WhySectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

export function WhySection({ opportunity, animationIndex }: WhySectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <AnimatedSection id="pourquoi" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={4} title="Pourquoi ça marche" />
      <p className="mb-6 text-sm text-gray-500">
        Les faits qui prouvent que ce marché est réel — et que la fenêtre est ouverte
      </p>

      <div className="space-y-2">
        {opportunity.whyItWorks.map((item, i) => {
          const isOpen = openIndex === i;
          const fact = typeof item === "string" ? item : item.fact;
          const detail = typeof item === "object" ? item.detail : null;
          const source = typeof item === "object" ? item.source : null;
          const sourceUrl = typeof item === "object" ? item.sourceUrl : null;

          return (
            <div
              key={i}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isOpen ? "border-gray-700 bg-gray-900" : "border-gray-800 bg-gray-900/40 hover:border-gray-700",
              )}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <span className="w-8 shrink-0 text-2xl font-black tabular-nums text-gray-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="flex-1 text-sm leading-relaxed text-gray-200">{fact}</p>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {isOpen && (
                <div className="border-t border-gray-800 px-5 pb-5 pl-17">
                  <div className="space-y-3 pl-12 pt-4">
                    {detail && (
                      <p className="text-sm leading-relaxed text-gray-400">{detail}</p>
                    )}
                    {source && (
                      <a
                        href={sourceUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 transition-colors hover:text-blue-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Source : {source}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
