"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "./checkout-button";
import { PLAN_PRICING, formatEuro, type PaidPlan } from "@/lib/billing/plans";

type BillingContextValue = {
  monthly: boolean;
  setMonthly: (monthly: boolean) => void;
};

const BillingContext = createContext<BillingContextValue | null>(null);

function usePricingBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("PricingBillingProvider manquant");
  return ctx;
}

export function PricingBillingProvider({ children }: { children: ReactNode }) {
  const [monthly, setMonthly] = useState(true);
  return (
    <BillingContext.Provider value={{ monthly, setMonthly }}>{children}</BillingContext.Provider>
  );
}

export function PricingBillingToggle() {
  const { monthly, setMonthly } = usePricingBilling();

  return (
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
          monthly ? "Passer à la facturation annuelle" : "Passer à la facturation mensuelle"
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
  );
}

export function PricingPrice({ plan }: { plan: PaidPlan }) {
  const { monthly } = usePricingBilling();
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

export function PricingCheckout({
  plan,
  className,
  children,
}: {
  plan: PaidPlan;
  className?: string;
  children: ReactNode;
}) {
  const { monthly } = usePricingBilling();

  return (
    <CheckoutButton
      plan={plan}
      interval={monthly ? "month" : "year"}
      className={className}
    >
      {children}
    </CheckoutButton>
  );
}
