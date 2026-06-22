"use client";

import { motion } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";
import type { Scores } from "@/types/opportunity";
import { SCORE_AXIS_LABELS, SUB_SCORE_KEYS } from "@/lib/scoring/rubric";

const labels: { key: keyof Scores; label: string; max: number }[] = [
  { key: "opportunity", label: SCORE_AXIS_LABELS.opportunity, max: 100 },
  ...SUB_SCORE_KEYS.map((key) => ({
    key,
    label: SCORE_AXIS_LABELS[key],
    max: 10,
  })),
];

export function ScoreBars({ scores, compact = false }: { scores: Scores; compact?: boolean }) {
  const mounted = useMounted();

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {labels.map(({ key, label, max }, i) => {
        const raw = scores[key];
        if (typeof raw !== "number") return null;
        const value = raw;
        const pct = (value / max) * 100;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className={compact ? "w-20 text-[10px] text-muted-foreground" : "w-24 text-xs text-muted-foreground"}>
              {label}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                initial={mounted ? { width: 0 } : false}
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
