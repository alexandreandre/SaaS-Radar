"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Lock } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { getTractionSignalDescription } from "@/components/opportunities/detail/detail-sections";

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

function AnimatedMetricValue({ value }: { value: string }) {
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
    <p ref={ref} className="mt-2 font-display text-3xl font-medium tabular-nums text-primary sm:text-4xl">
      {display}
    </p>
  );
}

function SignalCard({
  label,
  value,
  source,
  description,
}: {
  label: string;
  value: string;
  source: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.45 }}
      className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <AnimatedMetricValue value={value} />
      <p className="mt-2 text-xs text-muted-foreground">Source : {source}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}

export function TractionSignals({ opportunity }: { opportunity: Opportunity }) {
  const visible = opportunity.tractionSignals.slice(0, 2);
  const lockedCount = Math.max(0, opportunity.tractionSignals.length - 2);

  return (
    <SectionShell id="traction" title="Les preuves que le marché existe" className="mb-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visible.map((s) => (
          <SignalCard
            key={s.label}
            {...s}
            description={getTractionSignalDescription(opportunity, s)}
          />
        ))}
      </div>
      {lockedCount > 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <span>
            + {lockedCount} autre{lockedCount > 1 ? "s" : ""} signau{lockedCount > 1 ? "x" : "l"} disponible
            {lockedCount > 1 ? "s" : ""} avec l&apos;abonnement Builder
          </span>
        </p>
      )}
    </SectionShell>
  );
}
