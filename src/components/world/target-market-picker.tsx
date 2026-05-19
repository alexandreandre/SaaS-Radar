"use client";

import { useTargetMarket } from "@/context/target-market-context";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

export function TargetMarketPicker({ className }: { className?: string }) {
  const { target, setTargetCode, pickerOptions } = useTargetMarket();

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-zinc-300">
        <Target className="h-4 w-4 shrink-0 text-accent" />
        <span className="font-medium text-white">Je lance sur</span>
      </div>
      <div className="relative min-w-[200px] flex-1 sm:min-w-[240px]">
        <select
          value={target.code}
          onChange={(e) => setTargetCode(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-white/15 bg-black/60 py-2.5 pl-3 pr-10 text-sm font-medium text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Marché cible pour vos recommandations"
        >
          {pickerOptions.map((o) => (
            <option key={o.code} value={o.code} className="bg-zinc-900">
              {o.flag} {o.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
          ▾
        </span>
      </div>
      <p className="w-full text-[11px] leading-snug text-zinc-500 sm:w-auto sm:max-w-xs">
        Verdicts, scores d&apos;import et opportunités adaptés à ce marché.
      </p>
    </div>
  );
}
