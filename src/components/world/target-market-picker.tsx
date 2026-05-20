"use client";

import { useTargetMarket } from "@/context/target-market-context";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

export function TargetMarketPicker({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "discrete";
}) {
  const { target, setTargetCode, pickerOptions } = useTargetMarket();
  const discrete = variant === "discrete";

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-wrap items-center backdrop-blur-md",
        discrete
          ? "gap-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5"
          : "gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          discrete ? "text-[11px] text-map-muted" : "text-sm text-hero-foreground/80"
        )}
      >
        <Target className={cn("shrink-0 text-primary", discrete ? "h-3 w-3" : "h-4 w-4")} />
        {!discrete && <span className="font-medium text-white">Je lance sur</span>}
        {discrete && <span className="hidden sm:inline">Marché</span>}
      </div>
      <div className={cn("relative", discrete ? "min-w-[130px]" : "min-w-[200px] flex-1 sm:min-w-[240px]")}>
        <select
          value={target.code}
          onChange={(e) => setTargetCode(e.target.value)}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-lg border border-white/15 bg-black/60 font-medium text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
            discrete ? "py-1.5 pl-2 pr-7 text-xs" : "py-2.5 pl-3 pr-10 text-sm"
          )}
          aria-label="Marché cible pour vos recommandations"
        >
          {pickerOptions.map((o) => (
            <option key={o.code} value={o.code} className="bg-hero">
              {o.flag} {o.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-map-muted">
          ▾
        </span>
      </div>
      {!discrete && (
        <p className="w-full text-[11px] leading-snug text-map-muted sm:w-auto sm:max-w-xs">
          Verdicts, scores d&apos;import et opportunités adaptés à ce marché.
        </p>
      )}
    </div>
  );
}
