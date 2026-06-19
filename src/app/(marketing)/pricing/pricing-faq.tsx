"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function PricingFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 pb-20">
      <h2 className="mb-8 text-center font-display text-2xl font-medium tracking-tight text-foreground">
        Questions fréquentes
      </h2>
      <div className="space-y-3">
        {faqItems.map((item, index) => {
          const isOpen = openFaq === index;
          return (
            <div key={item.q} className="overflow-hidden rounded-xl border border-border">
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
                    isOpen && "rotate-180",
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
  );
}
