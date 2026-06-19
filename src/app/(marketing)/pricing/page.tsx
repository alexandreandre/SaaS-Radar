import Link from "next/link";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import {
  PricingBillingProvider,
  PricingBillingToggle,
  PricingCheckout,
  PricingPrice,
} from "./pricing-billing";

const PricingFaq = dynamic(
  () => import("./pricing-faq").then((m) => ({ default: m.PricingFaq })),
  { loading: () => <div className="mx-auto h-48 max-w-2xl px-4" aria-hidden /> },
);

export const metadata = {
  title: "Tarifs — SaaS Radar",
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

const FREE_FEATURES = [
  "3 opportunités / mois",
  "Scores et pitch de chaque idée",
  "Carte monde interactive",
  "Flash newsletter quotidien",
  "Simulateur MRR",
];

const FREE_EXCLUDED = ["Guides complets", "Prompt Claude Code", "Stratégie d'acquisition"];

const BUILDER_FEATURES = [
  "Tout le plan Free",
  "Opportunités illimitées",
  "Guide complet J1 → J14",
  "Le SaaS sur son marché US",
  "Potentiel financier détaillé",
  "Stratégie d'acquisition France",
  "Trouver tes premiers clients",
  "Prompt Claude Code",
  "Générez le MVP en 1 session",
  "Comparateur d'opportunités",
  "Accès aux archives complètes",
];

const PRO_FEATURES = [
  "Tout le plan Builder",
  "Emails cold prêts à envoyer",
  "Partenaires France",
  "Alertes concurrence",
  "Variantes Cursor / v0 / Replit",
  "Accès prioritaire aux nouvelles features",
  "Support email prioritaire",
];

function FeatureItem({ included, children }: { included: boolean; children: string }) {
  return (
    <li className={cn("flex items-center gap-2", !included && "opacity-40")}>
      <span className="w-4 shrink-0 text-center text-primary" aria-hidden>
        {included ? "✓" : "×"}
      </span>
      {children}
    </li>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <PricingBillingProvider>
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
            <PricingBillingToggle />
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
            <div className="rounded-2xl border border-border bg-muted/20 p-8">
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
                {FREE_FEATURES.map((f) => (
                  <FeatureItem key={f} included>
                    {f}
                  </FeatureItem>
                ))}
                {FREE_EXCLUDED.map((f) => (
                  <FeatureItem key={f} included={false}>
                    {f}
                  </FeatureItem>
                ))}
              </ul>
            </div>

            <div className="relative mt-6">
              <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                <span className="whitespace-nowrap rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  LE PLUS POPULAIRE
                </span>
              </div>

              <div className="rounded-2xl border border-primary/50 bg-primary/5 p-8">
                <p className="mb-1 text-sm font-medium text-primary">Builder</p>
                <PricingPrice plan="builder" />
                <p className="mb-6 mt-4 text-sm text-muted-foreground">
                  Tout ce qu&apos;il faut pour lancer
                </p>

                <PricingCheckout
                  plan="builder"
                  className="mb-8 block w-full rounded-xl bg-primary py-2.5 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  Commencer avec Builder →
                </PricingCheckout>

                <ul className="space-y-3 text-sm text-foreground">
                  {BUILDER_FEATURES.map((f) => (
                    <FeatureItem key={f} included>
                      {f}
                    </FeatureItem>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-8">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Pro</p>
              <PricingPrice plan="pro" />
              <p className="mb-6 mt-4 text-sm text-muted-foreground">Pour aller vite et bien</p>

              <PricingCheckout
                plan="pro"
                className="mb-8 block w-full rounded-xl border border-border py-2.5 text-center font-semibold text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60"
              >
                Commencer avec Pro →
              </PricingCheckout>

              <ul className="space-y-3 text-sm text-foreground">
                {PRO_FEATURES.map((f) => (
                  <FeatureItem key={f} included>
                    {f}
                  </FeatureItem>
                ))}
              </ul>
            </div>
          </section>
        </PricingBillingProvider>

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

        <PricingFaq />
      </main>
      <Footer />
    </div>
  );
}
