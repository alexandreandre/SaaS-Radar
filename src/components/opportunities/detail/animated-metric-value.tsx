"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";

function parseNumericValue(value: string): number {
  const match = value.replace(/,/g, "").match(/[\d.]+/);
  if (!match) return 0;
  let num = parseFloat(match[0]);
  if (/k/i.test(value)) num *= 1000;
  if (/m/i.test(value) && !/mo|month/i.test(value)) num *= 1_000_000;
  return Math.round(num);
}

function formatAnimatedValue(value: string, n: number): string {
  const prefix = value.match(/^([^\d]*)/)?.[1] ?? "";
  const rounded = Math.round(n);
  if (/\bk\b/i.test(value) && rounded >= 1_000) {
    return `${prefix}${Math.round(rounded / 1_000)}k`;
  }
  if (/\bm\b/i.test(value) && !/mo|month/i.test(value) && rounded >= 1_000_000) {
    return `${prefix}${Math.round(rounded / 1_000_000)}M`;
  }
  return `${prefix}${rounded.toLocaleString("fr-FR")}`;
}

type AnimatedMetricValueProps = {
  value: string;
  className?: string;
};

export function AnimatedMetricValue({ value, className }: AnimatedMetricValueProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const target = parseNumericValue(value);
  const canAnimate = target > 0;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || !canAnimate) {
      setDisplay(value);
      return;
    }

    setDisplay(formatAnimatedValue(value, 0));
    const duration = 1500;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(formatAnimatedValue(value, target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, canAnimate, target, value]);

  return (
    <p
      ref={ref}
      className={cn(
        "font-display text-3xl font-black tabular-nums sm:text-4xl",
        className
      )}
    >
      {display}
    </p>
  );
}
