"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  detailNavSections,
  LOCKED_SECTIONS_COUNT,
} from "@/components/opportunities/detail/detail-nav-sections";

interface DetailChecklistProps {
  opportunityName: string;
}

export function DetailChecklist({ opportunityName }: DetailChecklistProps) {
  const [activeSection, setActiveSection] = useState(detailNavSections[0].id);

  useEffect(() => {
    const sectionElements = detailNavSections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el != null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <aside className="sticky top-24 hidden w-[280px] shrink-0 lg:block">
        <p className="mb-3 truncate text-xs uppercase tracking-wider text-gray-500" title={opportunityName}>
          Navigation
        </p>

        <nav className="space-y-1">
          {detailNavSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                activeSection === section.id
                  ? "border border-blue-600/30 bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              {section.locked ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-gray-600" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
              )}
              <span className="flex-1">
                {section.number}. {section.title}
              </span>
              {section.locked && section.plan && (
                <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {section.plan}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="mt-6 rounded-xl border border-gray-700 bg-gray-900 p-4">
          <p className="mb-3 text-xs text-gray-400">🔒 {LOCKED_SECTIONS_COUNT} sections verrouillées</p>
          <Link
            href="#paywall"
            className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Débloquer tout — 29€/mois
          </Link>
          <p className="mt-2 text-center text-[11px] text-gray-500">
            ou Pro à 79€/mois avec Prompt Claude
          </p>
        </div>
      </aside>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-gray-700 bg-gray-900 p-3 lg:hidden">
        <p className="text-xs text-gray-400">🔒 {LOCKED_SECTIONS_COUNT} sections verrouillées</p>
        <Link
          href="#paywall"
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Débloquer — 29€/mois
        </Link>
      </div>
    </>
  );
}
