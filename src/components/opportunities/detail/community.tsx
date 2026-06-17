import Link from "next/link";
import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const testimonials = [
  { quote: "J'ai shipé le MVP en 11 jours grâce au plan MVP.", author: "Thomas, ex-dev SaaS" },
  { quote: "Le CAC par canal m'a évité 2 mois de tâtonnements.", author: "Sarah, solo founder" },
];

export function Community({ opportunity }: { opportunity: Opportunity }) {
  return (
    <SectionShell id="community" title="Communauté buildeurs">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          <strong className="text-foreground">{opportunity.entrepreneursBuilding}</strong> entrepreneurs
          travaillent déjà sur cette opportunité
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {testimonials.map((t) => (
          <blockquote key={t.author} className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="italic text-foreground/90">« {t.quote} »</p>
            <footer className="mt-2 text-xs text-muted-foreground">— {t.author}</footer>
          </blockquote>
        ))}
      </div>
      <PaywallGate
        requiredTier="builder"
        className="mt-6"
        preview={<p className="text-sm text-muted-foreground">Accès Discord communauté + channel niche</p>}
        message="Rejoignez les builders sur cette opportunité"
      >
        <Button variant="outline" asChild>
          <Link href="/mes-saas">Rejoindre le Discord Builder</Link>
        </Button>
      </PaywallGate>
    </SectionShell>
  );
}
