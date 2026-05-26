"use client";

import { motion } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  label: string;
  value: number;
  max: number;
  tooltip?: string;
  size?: "sm" | "md" | "lg";
  /** Diamètre total du cercle en px (prioritaire sur size). */
  diameter?: number;
  delay?: number;
  hideLabel?: boolean;
  /** Affiche /{max} même quand max vaut 100 (score opportunité). */
  showMax?: boolean;
}

export function ScoreGauge({
  label,
  value,
  max,
  tooltip,
  size = "md",
  diameter,
  delay = 0,
  hideLabel = false,
  showMax = false,
}: ScoreGaugeProps) {
  const mounted = useMounted();
  const pct = Math.min(100, (value / max) * 100);
  const stroke = diameter != null ? (diameter >= 72 ? 5 : 4) : size === "sm" ? 4 : 5;
  const radius =
    diameter != null
      ? (diameter - stroke) / 2
      : size === "sm"
        ? 28
        : size === "lg"
          ? 44
          : 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const dim = diameter ?? (radius + stroke) * 2;
  const isCompact = dim <= 68;

  const viewPad = stroke / 2;

  const gauge = (
    <div className="flex flex-col items-center gap-2 overflow-visible">
      <div className="relative overflow-visible" style={{ width: dim, height: dim }}>
        <svg
          width={dim}
          height={dim}
          viewBox={`${-viewPad} ${-viewPad} ${dim + stroke} ${dim + stroke}`}
          overflow="visible"
          className="-rotate-90 overflow-visible"
        >
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            className="stroke-primary"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={mounted ? { strokeDashoffset: circumference } : false}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-semibold tabular-nums",
              isCompact ? "text-sm" : diameter != null && dim >= 76 ? "text-lg" : size === "lg" ? "text-xl" : "text-sm"
            )}
          >
            {value}
          </span>
          {(showMax || max !== 100) && (
            <span className="text-[10px] text-muted-foreground">/{max}</span>
          )}
        </div>
      </div>
      {!hideLabel && label ? (
        <span className="text-center text-xs text-muted-foreground">{label}</span>
      ) : null}
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
