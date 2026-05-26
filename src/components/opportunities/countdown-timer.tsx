"use client";

import { useEffect, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { getEndOfWeekCountdown, getMidnightCountdown, getNextMondayCountdown } from "@/lib/utils";
import { cn } from "@/lib/utils";

type CountdownVariant = "day" | "week" | "weekEnd";

const defaultLabels: Record<CountdownVariant, string> = {
  day: "Prochain deal dans",
  week: "Nouveau deal dans",
  weekEnd: "Actualisation dans :",
};

export function CountdownTimer({
  dark = false,
  variant = "week",
  label,
}: {
  dark?: boolean;
  variant?: CountdownVariant;
  label?: string;
}) {
  const mounted = useMounted();
  const [weekTime, setWeekTime] = useState(getNextMondayCountdown);
  const [weekEndTime, setWeekEndTime] = useState(getEndOfWeekCountdown);
  const [dayTime, setDayTime] = useState(getMidnightCountdown);

  useEffect(() => {
    const tick = () => {
      if (variant === "day") setDayTime(getMidnightCountdown());
      else if (variant === "weekEnd") setWeekEndTime(getEndOfWeekCountdown());
      else setWeekTime(getNextMondayCountdown());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [variant]);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const displayLabel = label ?? defaultLabels[variant];
  const digits = !mounted
    ? "--:--:--"
    : variant === "day"
      ? `${pad(dayTime.hours)}:${pad(dayTime.minutes)}:${pad(dayTime.seconds)}`
      : variant === "weekEnd"
        ? weekEndTime.days > 0
          ? `${weekEndTime.days}j ${pad(weekEndTime.hours)}:${pad(weekEndTime.minutes)}:${pad(weekEndTime.seconds)}`
          : `${pad(weekEndTime.hours)}:${pad(weekEndTime.minutes)}:${pad(weekEndTime.seconds)}`
        : `${weekTime.days}j ${pad(weekTime.hours)}:${pad(weekTime.minutes)}:${pad(weekTime.seconds)}`;

  const urgent = variant === "day" || variant === "weekEnd";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-data text-[10px] uppercase tracking-data tabular-nums",
        urgent ? "text-destructive/80" : dark ? "text-map-muted" : "text-muted-foreground"
      )}
    >
      <span>{displayLabel}</span>
      <span
        suppressHydrationWarning
        className={cn(
          "font-medium",
          urgent && "countdown-urgent",
          !urgent && (dark ? "text-white" : "text-foreground")
        )}
      >
        {digits}
      </span>
    </div>
  );
}
