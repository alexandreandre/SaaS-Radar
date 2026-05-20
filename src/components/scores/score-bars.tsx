"use client";

import { motion } from "framer-motion";
import type { Scores } from "@/types/opportunity";

const labels: { key: keyof Scores; label: string; max: number }[] = [
  { key: "opportunity", label: "Opportunité", max: 100 },
  { key: "franceFit", label: "France Fit", max: 10 },
  { key: "buildability", label: "Buildability", max: 10 },
  { key: "margin", label: "Marge", max: 10 },
  { key: "competitionGap", label: "Competition Gap", max: 10 },
];

export function ScoreBars({ scores, compact = false }: { scores: Scores; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {labels.map(({ key, label, max }, i) => {
        const value = scores[key];
        const pct = (value / max) * 100;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className={compact ? "w-20 text-[10px] text-muted-foreground" : "w-24 text-xs text-muted-foreground"}>
              {label}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            </div>
            <span className={compact ? "w-6 font-data text-[10px] tabular-nums text-muted-foreground" : "w-8 font-data text-xs tabular-nums text-muted-foreground"}>
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
