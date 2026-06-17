"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { getWhyItWorksFact } from "@/types/opportunity";
import { detailSections, getLockedGuideTeasers } from "@/components/opportunities/detail/detail-sections";
import { Button } from "@/components/ui/button";
import { tierPrices } from "@/lib/tier";

const PAYWALL_BENEFITS: { title: string; detail: string }[] = [
  {
    title: "Le SaaS tel qu'il existe aux US",
    detail: "Fonctionnalités, pricing, traction réelle",
  },
  {
    title: "Combien vous pouvez vraiment gagner",
    detail: "Scénarios Prudent / Réaliste / Optimiste détaillés",
  },
  {
    title: "Votre stratégie d'acquisition France",
    detail: "Canaux, coûts, templates emails",
  },
  {
    title: "Le guide J1 → J14",
    detail: "Exactement ce qu'il faut faire chaque jour",
  },
];

export function DetailConversionPaywall({ opportunity }: { opportunity: Opportunity }) {
  const step1 = detailSections[0];
  const step2 = getLockedGuideTeasers(opportunity)[0];
  const lockedSteps = getLockedGuideTeasers(opportunity).slice(1);

  return (
    <section id="guide" className="mb-6 scroll-mt-28">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
        <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Le guide complet pour lancer ce SaaS
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          7 étapes de l&apos;idée au premier client payant
        </p>

        <div className="relative mt-8">
          <div>
            <p className="font-data text-xs font-medium uppercase tracking-data text-primary">
              Étape 1 · {step1.label.replace(/^\d+\.\s*/, "")}
            </p>
            <ul className="mt-4 space-y-4">
              {opportunity.whyItWorks.map((text, i) => (
                <li key={i} className="flex gap-3 text-base leading-relaxed sm:text-lg">
                  <span className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  <span>{getWhyItWorksFact(text)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-8">
            <p className="font-data text-xs font-medium uppercase tracking-data text-primary">
              Étape 2 · {step2.label}
            </p>
            <p className="relative mt-3 line-clamp-3 text-lg leading-relaxed text-foreground/90">
              {step2.teaser}
            </p>
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background"
              aria-hidden
            />
          </div>

          <div
            className="pointer-events-none mt-4 select-none space-y-6 blur-sm opacity-40"
            aria-hidden
          >
            {lockedSteps.map((step) => (
              <div key={step.id}>
                <p className="font-data text-xs font-medium uppercase tracking-data text-primary/80">
                  Étape {step.step}
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{step.label}</p>
                <p className="mt-2 line-clamp-1 text-base text-muted-foreground">{step.teaser}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 -mt-8 mx-4">
            <motion.div
              id="paywall"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-lg scroll-mt-28 rounded-2xl border border-border bg-card p-6 text-foreground/90 shadow-2xl sm:p-8"
            >
              <div className="space-y-3 border-b border-border pb-6 text-center">
                <p className="text-base leading-relaxed text-foreground/80">
                  Vous venez de voir pourquoi ça marche.
                </p>
                <p className="text-lg font-medium text-foreground">La suite, c&apos;est comment le faire.</p>
              </div>

              <p className="mt-6 text-sm font-medium text-muted-foreground">
                Ce que vous débloquez avec Builder ({tierPrices.builder}) :
              </p>

              <ul className="mt-5 space-y-4">
                {PAYWALL_BENEFITS.map((item) => (
                  <li key={item.title} className="flex gap-3 text-left">
                    <span className="shrink-0 font-semibold text-primary" aria-hidden>
                      ✓
                    </span>
                    <div>
                      <p className="font-medium text-foreground/90">{item.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">→ {item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button size="lg" className="h-12 w-full text-lg font-semibold" asChild>
                  <Link href="/mes-saas">
                    Débloquer ce guide — {tierPrices.builder}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <div className="mt-5 rounded-lg bg-muted/50 px-4 py-4 text-center">
                  <p className="tracking-wide text-amber-400" aria-label="5 étoiles sur 5">
                    ★★★★★
                  </p>
                  <p className="mt-2 text-sm italic text-foreground/80">
                    &ldquo;J&apos;ai lancé en 11 jours grâce au guide&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    — Thomas R., Bordeaux · Abonné Builder
                  </p>
                </div>

                <div className="mt-6 flex flex-col items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border bg-transparent text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                    asChild
                  >
                    <Link href="/mes-saas">Abonnement Pro — {tierPrices.pro}</Link>
                  </Button>
                  <p className="max-w-xs text-center text-xs text-muted-foreground">
                    (inclut le Prompt Claude Code pour générer le MVP en 1 session)
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
