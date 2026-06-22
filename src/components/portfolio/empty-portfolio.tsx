import { LogoMark } from "@/components/brand/logo-mark";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyPortfolioProps = {
  weeklyPickSlug?: string;
};

export function EmptyPortfolio({ weeklyPickSlug }: EmptyPortfolioProps) {
  const weeklyPickHref = weeklyPickSlug
    ? `/opportunities/${weeklyPickSlug}`
    : "/opportunities";

  return (
    <section className="rounded-xl border border-dashed border-primary/30 bg-accent/20 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <LogoMark className="h-8" aria-hidden />
      </div>
      <h2 className="mt-6 font-display text-2xl font-medium">Aucun SaaS en cours</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Choisissez une opportunité dans le catalogue et cliquez sur « Je build cette opportunité »
        pour suivre votre progression face au plan de la fiche.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/opportunities">Explorer les opportunités</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={weeklyPickHref}>Voir le pick de la semaine</Link>
        </Button>
      </div>
    </section>
  );
}
