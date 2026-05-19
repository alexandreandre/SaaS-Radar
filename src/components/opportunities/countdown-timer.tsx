"use client";

import { useEffect, useState } from "react";
import { getNextMondayCountdown } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function CountdownTimer({ dark = false }: { dark?: boolean }) {
  const [time, setTime] = useState(getNextMondayCountdown());

  useEffect(() => {
    const id = setInterval(() => setTime(getNextMondayCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className={cn("flex items-center gap-1.5 text-xs tabular-nums", dark ? "text-zinc-400" : "text-muted-foreground")}>
      <span>Nouveau deal dans</span>
      <span className={cn("font-medium", dark ? "text-white" : "text-foreground")}>
        {time.days}j {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </span>
    </div>
  );
}
