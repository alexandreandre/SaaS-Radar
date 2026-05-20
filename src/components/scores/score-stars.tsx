"use client";

import { Star } from "lucide-react";
import { scoreColor, scoreColorClass, scoreToFive } from "@/lib/scores";
import { cn } from "@/lib/utils";

export function ScoreStars({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const filled = scoreToFive(value, max);
  const color = scoreColor(value, max);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className="inline-flex gap-px"
        role="img"
        aria-label={`${label} : ${filled} sur 5`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-2.5 w-2.5",
              i < filled ? cn(scoreColorClass[color], "opacity-75") : "text-muted-foreground/20"
            )}
            fill={i < filled ? "currentColor" : "none"}
            strokeWidth={i < filled ? 0 : 1.5}
            aria-hidden
          />
        ))}
      </span>
    </span>
  );
}
