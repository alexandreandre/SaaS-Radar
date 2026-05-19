"use client";

import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  label: string;
  value: number;
  max: number;
  tooltip?: string;
  size?: "sm" | "md" | "lg";
  delay?: number;
}

export function ScoreGauge({ label, value, max, tooltip, size = "md", delay = 0 }: ScoreGaugeProps) {
  const pct = Math.min(100, (value / max) * 100);
  const radius = size === "sm" ? 28 : size === "lg" ? 44 : 36;
  const stroke = size === "sm" ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const dim = (radius + stroke) * 2;

  const gauge = (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#E4E4E7"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#2563EB"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-semibold tabular-nums", size === "lg" ? "text-xl" : "text-sm")}>
            {value}
          </span>
          {max !== 100 && (
            <span className="text-[10px] text-muted-foreground">/{max}</span>
          )}
        </div>
      </div>
      <span className="text-center text-xs text-muted-foreground">{label}</span>
    </div>
  );

  if (!tooltip) return gauge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="cursor-help">{gauge}</button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
