"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function IdeaBriefPlaceholder({ project }: CockpitModuleProps) {
  const seed = project.ideaSeed ?? project.productName ?? "";

  return (
    <section className="rounded-xl border border-dashed border-primary/30 bg-card/50 px-6 py-12 text-center">
      <p className="font-display text-lg font-medium">Votre fiche Idée</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Décrivez votre projet pour générer l&apos;analyse marché, la concurrence et le business plan.
      </p>
      <Button asChild className="mt-6" size="sm">
        <Link href={seed ? `/start?idea=${encodeURIComponent(seed)}` : "/start"}>
          Décrire mon projet
        </Link>
      </Button>
    </section>
  );
}
