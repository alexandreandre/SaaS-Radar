"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

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

export default function PricingPage() {
  const [monthly, setMonthly] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar dark />
      <main>
        <section className="px-4 py-16 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-blue-400">Tarifs</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Lancez votre micro-SaaS.
            <br />
            <span className="text-blue-400">Pas votre budget.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-gray-400">
            Accédez aux opportunités validées, aux guides complets et aux prompts Claude Code pour
            lancer en 14 jours.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={monthly ? "text-white" : "text-gray-500"}>Mensuel</span>
            <button
              type="button"
              onClick={() => setMonthly(!monthly)}
              aria-label={monthly ? "Passer à la facturation annuelle" : "Passer à la facturation mensuelle"}
              className={cn(
                "relative h-6 w-12 rounded-full transition-colors",
                monthly ? "bg-gray-700" : "bg-blue-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                  monthly ? "left-1" : "left-7"
                )}
              />
            </button>
            <span
              className={cn(
                "flex items-center gap-2",
                !monthly ? "text-white" : "text-gray-500"
              )}
            >
              Annuel
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                -20%
              </span>
            </span>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8"
          >
            <p className="mb-1 text-sm font-medium text-gray-400">Free</p>
            <p className="mb-1 text-4xl font-bold text-white">0€</p>
            <p className="mb-6 text-sm text-gray-500">Pour toujours</p>

            <Link
              href="/opportunities"
              className="mb-8 block w-full rounded-xl border border-gray-700 py-2.5 text-center font-medium text-gray-300 transition-colors hover:border-gray-500"
            >
              Commencer gratuitement
            </Link>

            <ul className="space-y-3 text-sm text-gray-400">
              {[
                "3 opportunités / mois",
                "Scores et pitch de chaque idée",
                "Carte monde interactive",
                "Flash newsletter quotidien",
                "Simulateur MRR",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-gray-600" />
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
            className="relative overflow-hidden rounded-2xl border border-blue-500/50 bg-blue-950/20 p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.35)]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                LE PLUS POPULAIRE
              </span>
            </div>

            <div className="relative">
              <p className="mb-1 text-sm font-medium text-blue-400">Builder</p>
              <div className="mb-1 flex items-end gap-2">
                <p className="text-4xl font-bold text-white">
                  <AnimatedPrice value={monthly ? "29€" : "23€"} />
                </p>
                <p className="mb-1 text-sm text-gray-400">/mois</p>
              </div>
              <AnimatePresence mode="wait">
                {!monthly && (
                  <motion.p
                    key="builder-annual"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-1 text-xs text-green-400"
                  >
                    facturé 276€/an — économisez 72€
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="mb-6 text-sm text-gray-500">Tout ce qu&apos;il faut pour lancer</p>

              <Link
                href="/checkout/builder"
                className="mb-8 block w-full rounded-xl bg-blue-600 py-2.5 text-center font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Commencer avec Builder →
              </Link>

              <ul className="space-y-3 text-sm text-gray-300">
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
                    <Check className="h-4 w-4 shrink-0 text-blue-400" />
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
            className="rounded-2xl border border-gray-700 bg-gray-900/50 p-8"
          >
            <p className="mb-1 text-sm font-medium text-purple-400">Pro</p>
            <div className="mb-1 flex items-end gap-2">
              <p className="text-4xl font-bold text-white">
                <AnimatedPrice value={monthly ? "79€" : "63€"} />
              </p>
              <p className="mb-1 text-sm text-gray-400">/mois</p>
            </div>
            <AnimatePresence mode="wait">
              {!monthly && (
                <motion.p
                  key="pro-annual"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mb-1 text-xs text-green-400"
                >
                  facturé 756€/an — économisez 192€
                </motion.p>
              )}
            </AnimatePresence>
            <p className="mb-6 text-sm text-gray-500">Pour aller vite et bien</p>

            <Link
              href="/checkout/pro"
              className="mb-8 block w-full rounded-xl border border-purple-500/50 py-2.5 text-center font-semibold text-purple-400 transition-colors hover:bg-purple-500/10"
            >
              Commencer avec Pro →
            </Link>

            <ul className="space-y-3 text-sm text-gray-300">
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
                  <Check className="h-4 w-4 shrink-0 text-purple-400" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold text-white">
            Ils ont lancé avec SaaS Radar
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <p className="mb-3 text-yellow-400">★★★★★</p>
                <p className="mb-4 text-sm italic text-gray-300">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">
                      {t.location} · {t.plan}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                    {t.mrr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-4 py-8 pb-20">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Questions fréquentes</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details key={item.q} className="group overflow-hidden rounded-xl border border-gray-800">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-medium text-white transition-colors hover:bg-gray-900/50">
                  {item.q}
                  <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-gray-400">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
