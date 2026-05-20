"use client";

import { useEffect, useState } from "react";
import { useTier } from "@/contexts/tier-context";
import { detailSections } from "@/components/opportunities/detail/detail-sections";
import { hasTier } from "@/lib/tier";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export function DetailToc() {
  const { tier } = useTier();
  const [active, setActive] = useState(detailSections[0]?.id ?? "why");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    detailSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-15% 0px -65% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav className="hidden lg:block" aria-label="Étapes de la fiche">
      <p className="text-sm font-semibold text-foreground">Où vous en êtes</p>
      <ul className="mt-4 space-y-1">
        {detailSections.map(({ id, label, tier: required }) => {
          const unlocked = hasTier(tier, required);
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors",
                  active === id
                    ? "bg-accent font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {!unlocked && required !== "free" && (
                  <Lock className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
                )}
                {unlocked && required !== "free" && (
                  <span className="h-5 w-5 shrink-0" aria-hidden />
                )}
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
