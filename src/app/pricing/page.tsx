"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "./checkout-button";
import { PLAN_PRICING, formatEuro, type PaidPlan } from "@/lib/billing/plans";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const testimonials = [
  {
    quote: "J'ai lancé mon SaaS de devis BTP en 11 jours. Premier client la semaine suivante.",
    name: "Thomas R.",
    location: "Bordeaux",
    plan: "Builder",
    mrr: "2 400€ MRR",
  },
  {
    quote: "Le prompt Claude Code m'a économisé 3 semaines de dev. Le guide est béton.",
    name: "Sarah M.",
    location: "Lyon",
    plan: "Pro",
    mrr: "4 800€ MRR",
  },
  {
    quote: "Sans SaaS Radar j'aurais encore cherché mon idée. Là je code depuis 2 semaines.",
    name: "Kevin D.",
    location: "Paris",
    plan: "Builder",
    mrr: "En cours de lancement",
  },
];

const faqItems = [
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans engagement. Vous pouvez annuler depuis votre espace membre en 1 clic. Vous gardez l'accès jusqu'à la fin de la période payée.",
  },
  {
    q: "Les opportunités sont-elles vraiment validées ?",
    a: "Chaque opportunité est analysée à partir de données réelles : MRR des concurrents US, signaux de traction, analyse du marché français. Pas de liste générée par IA.",
  },
  {
    q: "C'est quoi exactement le Prompt Claude Code ?",
    a: "Un prompt complet et calibré pour générer le MVP de l'opportunité de la semaine en une session Cursor ou Claude Code. Schéma DB, stack, séquence emails inclus.",
  },
  {
    q: "Puis-je passer du plan Builder au plan Pro ?",
    a: "Oui, à tout moment. Vous ne payez que la différence au prorata.",
  },
];

function AnimatedPrice({ value }: { value: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

function PriceBlock({ plan, monthly }: { plan: PaidPlan; monthly: boolean }) {
  const pricing = PLAN_PRICING[plan];
  const perMonth = monthly ? pricing.monthlyAmount : pricing.yearlyPerMonth;
  return (
    <>
      <div className="mb-1 flex items-end gap-2">
        <p className="font-display text-4xl font-medium tabular-nums text-foreground">
          <AnimatedPrice value={formatEuro(perMonth)} />
        </p>
        <p className="mb-1 text-sm text-muted-foreground">/mois</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {monthly
          ? "Facturé mensuellement, sans engagement"
          : `Soit ${formatEuro(pricing.yearlyAmount)} facturés une fois par an`}
      </p>
    </>
  );
}

export default function PricingPage() {
  const [monthly, setMonthly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="px-4 py-20 text-center">
          <p className="mb-4 font-data text-xs font-medium uppercase tracking-widest text-primary">
            Tarifs
          </p>
          <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            Trouvez votre SaaS.
            <br />
            <span className="text-muted-foreground">Lancez-le en 14 jours.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            Opportunités validées, guides complets et prompts Claude Code pour lancer votre
            prochain SaaS.
          </p>

          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                monthly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Mensuel
            </span>
            <button
              type="button"
              onClick={() => setMonthly(!monthly)}
              aria-label={
                monthly
                  ? "Passer à la facturation annuelle"
                  : "Passer à la facturation mensuelle"
              }
              className={cn(
                "relative h-6 w-12 rounded-full border border-border transition-colors",
                monthly ? "bg-muted" : "bg-primary"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-background transition-transform",
                  monthly ? "left-1" : "left-7"
                )}
              />
            </button>
            <span
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors",
                !monthly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Annuel
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                -20%
              </span>
            </span>
          </div>
        </section>

        <section className="mx-auto mb-12 max-w-2xl px-4">
          <div className="flex flex-col items-stretch justify-between gap-6 rounded-2xl border border-dashed border-border bg-muted/10 p-6 opacity-80 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 flex items-center gap-2 font-data text-xs uppercase tracking-widest text-muted-foreground">
                Pas encore prêt pour un abonnement ?
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-muted-foreground">
                  Bientôt
                </span>
              </p>
              <h3 className="mb-1 font-display text-xl font-medium text-foreground">
                Achetez une opportunité à la carte
              </h3>
              <p className="text-sm text-muted-foreground">
                Accédez à une seule fiche complète — guide, business plan, prompt Claude Code
                inclus. Disponible prochainement.
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-3 inline-block cursor-not-allowed rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground"
              >
                Bientôt disponible
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-3">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            className="rounded-2xl border border-border bg-muted/20 p-8"
          >
            <p className="mb-1 text-sm font-medium text-muted-foreground">Free</p>
            <p className="mb-1 font-display text-4xl font-medium tabular-nums text-foreground">
              0€
            </p>
            <p className="mb-6 text-sm text-muted-foreground">Pour toujours</p>

            <Link
              href="/opportunities"
              className="mb-8 block w-full rounded-xl border border-border py-2.5 text-center font-medium text-foreground transition-colors hover:bg-muted/30"
            >
              Commencer gratuitement
            </Link>

            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "3 opportunités / mois",
                "Scores et pitch de chaque idée",
                "Carte monde interactive",
                "Flash newsletter quotidien",
                "Simulateur MRR",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
              {["Guides complets", "Prompt Claude Code", "Stratégie d'acquisition"].map((f) => (
                <li key={f} className="flex items-center gap-2 opacity-40">
                  <X className="h-4 w-4 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            className="relative mt-6"
          >
            <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
              <span className="whitespace-nowrap rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                LE PLUS POPULAIRE
              </span>
            </div>

            <div className="rounded-2xl border border-primary/50 bg-primary/5 p-8">
              <p className="mb-1 text-sm font-medium text-primary">Builder</p>
              <PriceBlock plan="builder" monthly={monthly} />
              <p className="mb-6 mt-4 text-sm text-muted-foreground">Tout ce qu&apos;il faut pour lancer</p>

              <CheckoutButton
                plan="builder"
                interval={monthly ? "month" : "year"}
                className="mb-8 block w-full rounded-xl bg-primary py-2.5 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                Commencer avec Builder →
              </CheckoutButton>

              <ul className="space-y-3 text-sm text-foreground">
                {[
                  "Tout le plan Free",
                  "Opportunités illimitées",
                  "Guide complet J1 → J14",
                  "Le SaaS sur son marché US",
                  "Potentiel financier détaillé",
                  "Stratégie d'acquisition France",
                  "Trouver tes premiers clients",
                  "Comparateur d'opportunités",
                  "Accès aux archives complètes",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
                {["Prompt Claude Code"].map((f) => (
                  <li key={f} className="flex items-center gap-2 opacity-40">
                    <X className="h-4 w-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            className="rounded-2xl border border-border bg-muted/20 p-8"
          >
            <p className="mb-1 text-sm font-medium text-muted-foreground">Pro</p>
            <PriceBlock plan="pro" monthly={monthly} />
            <p className="mb-6 mt-4 text-sm text-muted-foreground">Pour aller vite et bien</p>

            <CheckoutButton
              plan="pro"
              interval={monthly ? "month" : "year"}
              className="mb-8 block w-full rounded-xl border border-border py-2.5 text-center font-semibold text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60"
            >
              Commencer avec Pro →
            </CheckoutButton>

            <ul className="space-y-3 text-sm text-foreground">
              {[
                "Tout le plan Builder",
                "Prompt Claude Code complet",
                "Générez le MVP en 1 session",
                "Variantes Cursor / v0 / Replit",
                "Nouveau prompt chaque semaine",
                "Accès prioritaire aux nouvelles features",
                "Support email prioritaire",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="mb-10 text-center font-display text-2xl font-medium tracking-tight text-foreground">
            Ils ont lancé avec SaaS Radar
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-muted/20 p-6">
                <p className="mb-3 text-primary">★★★★★</p>
                <p className="mb-4 text-sm italic text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.location} · {t.plan}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {t.mrr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-4 py-8 pb-20">
          <h2 className="mb-8 text-center font-display text-2xl font-medium tracking-tight text-foreground">
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/30"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-foreground">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
