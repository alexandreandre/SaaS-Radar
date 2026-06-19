"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "./checkout-button";
import { PLAN_PRICING, formatEuro, type PaidPlan } from "@/lib/billing/plans";

function PriceBlock({ plan, monthly }: { plan: PaidPlan; monthly: boolean }) {
  const pricing = PLAN_PRICING[plan];
  const perMonth = monthly ? pricing.monthlyAmount : pricing.yearlyPerMonth;
  return (
    <>
      <div className="mb-1 flex items-end gap-2">
        <p className="font-display text-4xl font-medium tabular-nums text-foreground">
          {formatEuro(perMonth)}
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

export function PricingPlans() {
  const [monthly, setMonthly] = useState(true);

  return (
    <>
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
              monthly ? "text-foreground" : "text-muted-foreground",
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
              monthly ? "bg-muted" : "bg-primary",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-4 w-4 rounded-full bg-background transition-transform",
                monthly ? "left-1" : "left-7",
              )}
            />
          </button>
          <span
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors",
              !monthly ? "text-foreground" : "text-muted-foreground",
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
        </div>

        <div className="relative mt-6">
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
                "Prompt Claude Code",
                "Générez le MVP en 1 session",
                "Comparateur d'opportunités",
                "Accès aux archives complètes",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-8">
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
              "Emails cold prêts à envoyer",
              "Partenaires France",
              "Alertes concurrence",
              "Variantes Cursor / v0 / Replit",
              "Accès prioritaire aux nouvelles features",
              "Support email prioritaire",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
