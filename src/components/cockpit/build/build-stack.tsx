"use client";

import { Wrench } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { matchInfraBrand } from "@/lib/build/brands";
import { BuildInfraLogo, StackInline } from "@/components/cockpit/build/build-tool-logo";

type BuildStackProps = {
  opportunity: Opportunity;
  collapsed?: boolean;
};

function StackContent({ opportunity }: { opportunity: Opportunity }) {
  const guide = opportunity.mvpPlan.stackGuide ?? [];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {guide.map((entry) => {
          const infraBrand = matchInfraBrand(entry.tool);

          return (
          <article
            key={entry.tool}
            className="rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:border-border/80"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2.5">
                {infraBrand ? (
                  <BuildInfraLogo brandId={infraBrand} size="xs" className="mt-0.5 shrink-0" />
                ) : null}
                <div className="min-w-0">
                  <p className="font-semibold">{entry.tool}</p>
                  <p className="text-xs text-primary">{entry.role}</p>
                </div>
              </div>
              {!infraBrand ? (
                <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{entry.why}</p>
            <div className="mt-3 rounded-lg bg-background/80 p-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Setup
              </p>
              <p className="mt-1 font-mono text-xs leading-relaxed">{entry.setup}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {entry.freeTier ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700">
                  {entry.freeTier}
                </span>
              ) : null}
              {entry.alternative ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  Alt. {entry.alternative}
                </span>
              ) : null}
            </div>
          </article>
          );
        })}
      </div>

      {opportunity.mvpPlan.stack.length > 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Stack complète :{" "}
          <StackInline items={opportunity.mvpPlan.stack} />
        </p>
      ) : null}
    </>
  );
}

export function BuildStack({ opportunity, collapsed = true }: BuildStackProps) {
  const guide = opportunity.mvpPlan.stackGuide ?? [];
  if (guide.length === 0) return null;

  if (!collapsed) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4">
          <p className="font-data text-[10px] uppercase tracking-data text-primary">Stack</p>
          <h3 className="mt-1 text-lg font-semibold">Recette de setup</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Chaque outil, son rôle et comment le configurer — dans l&apos;ordre.
          </p>
        </div>
        <StackContent opportunity={opportunity} />
      </section>
    );
  }

  return (
    <details className="rounded-xl border border-border bg-card shadow-card">
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
            Ressources
          </p>
          <p className="mt-0.5 font-medium">Stack &amp; setup ({guide.length} outils)</p>
        </div>
      </summary>
      <div className="border-t border-border px-5 pb-5 pt-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Chaque outil, son rôle et comment le configurer — dans l&apos;ordre.
        </p>
        <StackContent opportunity={opportunity} />
      </div>
    </details>
  );
}
