"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { AnimatedMetricValue } from "@/components/opportunities/detail/animated-metric-value";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { getTractionSignalDescription } from "@/components/opportunities/detail/detail-sections";

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
      <AnimatedMetricValue value={value} className="mt-2 text-primary" />
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
