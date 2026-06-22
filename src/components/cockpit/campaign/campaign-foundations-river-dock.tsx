"use client";

import type { UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import {
  formatAudienceRecap,
  formatGoalRecap,
  formatMessageAdaptationsRecap,
  formatMessageRecap,
} from "@/lib/campaign/foundations-river";
import { Button } from "@/components/ui/button";

type CampaignFoundationsRiverDockProps = {
  project: UserProject;
  opportunity: Opportunity;
  legacyReady?: boolean;
  onContinue: () => void;
  onOpenAdvanced?: () => void;
};

export function CampaignFoundationsRiverDock({
  project,
  opportunity,
  legacyReady,
  onContinue,
  onOpenAdvanced,
}: CampaignFoundationsRiverDockProps) {
  const setup = project.campaignSetup;
  const productName = project.productName ?? opportunity.name;
  const audienceRecap = formatAudienceRecap(setup, opportunity);
  const goalRecap = formatGoalRecap(setup);
  const messageRecap = formatMessageRecap(setup);
  const messageAdaptations = formatMessageAdaptationsRecap(setup);

  return (
    <section className="animate-in fade-in rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-6 shadow-card duration-300">
      <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
        {legacyReady ? "Vos fondations sont déjà posées" : "C'est prêt"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {legacyReady
          ? "Vous pouvez passer à la création ou ajuster la stratégie."
          : "Vous avez posé les bases. Prochaine étape : landing et contenus canal, prêts à copier-coller."}
      </p>

      <dl className="mt-5 space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Produit</dt>
          <dd className="font-medium">{productName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Pour qui</dt>
          <dd>{audienceRecap || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Approche</dt>
          <dd>{goalRecap}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Fil rouge</dt>
          <dd className="italic">{messageRecap}</dd>
        </div>
      </dl>

      {messageAdaptations.length > 0 ? (
        <details className="mt-3 rounded-lg border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Déclinaisons par canal
          </summary>
          <dl className="mt-3 space-y-2.5">
            {messageAdaptations.map((item) => (
              <div key={`${item.channel}-${item.label}`}>
                <dt className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-sm">{item.text}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}

      {setup?.strategyBrief ? (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer font-medium text-primary">Voir le brief complet</summary>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{setup.strategyBrief}</p>
        </details>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={onContinue}>
          Passer à la création →
        </Button>
        {onOpenAdvanced ? (
          <Button type="button" variant="ghost" size="sm" onClick={onOpenAdvanced}>
            Ajuster la stratégie
          </Button>
        ) : null}
      </div>
    </section>
  );
}
