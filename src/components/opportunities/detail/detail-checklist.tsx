"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { detailNavSections } from "@/components/opportunities/detail/detail-nav-sections";

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
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
            <span className="flex-1">
              {section.number}. {section.title}
            </span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
