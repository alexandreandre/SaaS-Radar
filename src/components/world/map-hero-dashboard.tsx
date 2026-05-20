"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Target, Flame, Database } from "lucide-react";
import { useTargetMarket } from "@/context/target-market-context";
import { worldMarkets, getGlobalStats } from "@/data/world-markets";
import { getTargetFit } from "@/lib/target-market-fit";
import { cn } from "@/lib/utils";

export type MapHeroFilter = "all" | "hot" | "database";

const FILTERS: { id: MapHeroFilter; label: string; icon: typeof Flame }[] = [
  { id: "all", label: "Tous", icon: Target },
  { id: "hot", label: "Top import", icon: Flame },
  { id: "database", label: "Candidats", icon: Database },
];

export function MapHeroDashboard({
  onBack,
  filter,
  onFilterChange,
}: {
  onBack: () => void;
  filter: MapHeroFilter;
  onFilterChange: (f: MapHeroFilter) => void;
}) {
  const { target, setTargetCode, pickerOptions } = useTargetMarket();
  const stats = useMemo(() => getGlobalStats(), []);

  const highFitCount = useMemo(
    () =>
      worldMarkets.filter(
        (m) => m.code !== target.code && getTargetFit(m.code, target.code).score >= 65
      ).length,
    [target.code]
  );

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="pointer-events-auto absolute left-4 top-20 z-20 w-[min(100%,17rem)] sm:w-72"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="rounded-lg border border-white/10 bg-black/50 p-3 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="mb-2.5 flex items-center gap-1 text-[11px] text-map-muted transition-colors hover:text-hero-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          aria-label="Revenir à l'accueil"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Accueil</span>
        </button>

        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-map-muted">
          Marché cible
        </label>
        <div className="relative">
          <select
            value={target.code}
            onChange={(e) => setTargetCode(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-lg border border-white/15 bg-black/50 py-2 pl-2.5 pr-8 text-xs font-medium text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Marché cible pour vos recommandations"
          >
            {pickerOptions.map((o) => (
              <option key={o.code} value={o.code} className="bg-hero">
                {o.flag} {o.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-map-muted">
            ▾
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium transition-colors",
                filter === id
                  ? "border-primary/70 bg-primary/90 text-white"
                  : "border-white/10 bg-black/40 text-map-muted hover:border-white/20 hover:text-hero-foreground/75"
              )}
            >
              <Icon className="h-2.5 w-2.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-1 border-t border-white/10 pt-2.5 text-[10px] text-map-muted">
          <p>
            <strong className="font-semibold text-primary">{highFitCount}</strong> marchés top import
            <span className="text-map-muted"> → {target.flag}</span>
          </p>
          <p>
            <strong className="text-white">{stats.countriesTracked}</strong> pays ·{" "}
            <strong className="text-white">{stats.totalMicroSaas.toLocaleString("fr-FR")}</strong> trackés
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
