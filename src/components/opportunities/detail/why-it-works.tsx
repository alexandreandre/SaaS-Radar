"use client";

import { motion } from "framer-motion";
import type { Opportunity } from "@/types/opportunity";
import { getWhyItWorksSources } from "@/components/opportunities/detail/detail-sections";
import { cn } from "@/lib/utils";

export function WhyItWorks({ opportunity }: { opportunity: Opportunity }) {
  const items = opportunity.whyItWorks.slice(0, 3);
  const sources = getWhyItWorksSources(opportunity);
  const originPhrase =
    opportunity.originCountry === "États-Unis"
      ? "aux États-Unis"
      : `en ${opportunity.originCountry}`;

  return (
    <section
      id="pourquoi"
      className="mb-6 scroll-mt-28 rounded-xl border border-border/60 bg-muted/50 p-6 shadow-card sm:p-8"
    >
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Ce business existe déjà — et cartonne {originPhrase}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Voici pourquoi il n&apos;existe pas encore en France
        </p>
      </div>

      <ul className="mt-8 grid gap-3">
        {items.map((text, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-24px" }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={cn(
              "flex gap-4 rounded-lg border border-border/80 bg-card/80 px-5 py-4",
              "text-base leading-relaxed sm:text-lg"
            )}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
              aria-hidden
            >
              ✓
            </span>
            <div className="min-w-0">
              <span>{text}</span>
              {sources[i] && (
                <p className="mt-2 text-sm italic text-muted-foreground/80">{sources[i]}</p>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
