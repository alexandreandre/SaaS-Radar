"use client";

import { useState } from "react";
import { ArrowRight, Rocket } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { usePortfolio } from "@/contexts/portfolio-context";
import { getMilestoneProgress } from "@/lib/portfolio";
import { getLaunchTeaser } from "@/lib/build-launch";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickLaunchSheet } from "@/components/cockpit/quick-launch/quick-launch-sheet";
import Link from "next/link";
import { getCockpitHref } from "@/lib/cockpit-modules";

type BuildOpportunityCtaProps = {
  opportunity: Opportunity;
  variant?: "header" | "sticky" | "footer";
  className?: string;
};

export function BuildOpportunityCta({
  opportunity,
  variant = "header",
  className,
}: BuildOpportunityCtaProps) {
  const { hydrated, getProjectBySlug } = usePortfolio();
  const existing = hydrated ? getProjectBySlug(opportunity.slug) : undefined;

  const [open, setOpen] = useState(false);

  if (existing) {
    const progress = getMilestoneProgress(existing);
    if (variant === "footer") {
      return (
        <div
          className={cn(
            "rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-card p-6 text-center",
            className
          )}
        >
          <p className="font-semibold text-foreground">Vous avez déjà commencé ce projet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reprenez là où vous en étiez — {progress} % du journal complété.
          </p>
          <Button variant="default" className="mt-4 gap-2" asChild>
            <Link href={getCockpitHref(existing.id, "build")}>
              Continuer mon build
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    }
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <Badge variant="outline" className="border-primary/30 text-primary">
          En build · {progress} % journal
        </Badge>
        <Button variant="default" asChild className={variant === "sticky" ? "flex-1" : ""}>
          <Link href={getCockpitHref(existing.id, "build")}>
            Continuer mon build
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const teaser = getLaunchTeaser(opportunity);

  if (variant === "footer") {
    return (
      <>
        <div
          className={cn(
            "rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-card p-6 text-center",
            className
          )}
        >
          <p className="font-semibold text-foreground">Prêt à passer à l&apos;action ?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {teaser} — votre plan est prêt, lancez le build en un clic.
          </p>
          <Button type="button" className="mt-4 gap-2" onClick={() => setOpen(true)}>
            <Rocket className="h-4 w-4" />
            Je build cette opportunité
          </Button>
        </div>
        <QuickLaunchSheet
          opportunity={opportunity}
          open={open}
          onOpenChange={setOpen}
          onLaunch={() => {
            // Projet créé et navigation gérés dans QuickLaunchSheet
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn("flex flex-col gap-2", variant === "sticky" && "w-full")}>
        {variant === "sticky" ? (
          <p className="text-center text-xs text-muted-foreground">{teaser}</p>
        ) : null}
        <Button
          type="button"
          className={cn(
            variant === "header" ? "w-full sm:w-auto" : "flex-1",
            variant === "sticky" && "shadow-lg",
            className
          )}
          onClick={() => setOpen(true)}
        >
          <Rocket className="h-4 w-4" />
          Je build cette opportunité
        </Button>
      </div>

      <QuickLaunchSheet
        opportunity={opportunity}
        open={open}
        onOpenChange={setOpen}
        onLaunch={() => {
          // Projet créé et navigation gérés dans QuickLaunchSheet
        }}
      />
    </>
  );
}
