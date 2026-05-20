import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { formatCurrency } from "@/lib/utils";

export function FindClients({ opportunity }: { opportunity: Opportunity }) {
  const competitors = opportunity.frenchCompetitors ?? [];
  const channels = opportunity.acquisition[0];

  const content = (
    <div className="space-y-10">
      <div>
        <h3 className="text-lg font-semibold">Par où commencer</h3>
        <p className="mt-2 text-base text-muted-foreground">
          Canal recommandé en premier : <strong className="text-foreground">{channels?.title ?? "Cold email"}</strong>
        </p>
        <ol className="mt-6 space-y-4">
          {opportunity.acquisition.slice(0, 2).flatMap((tab) =>
            tab.tactics.slice(0, 1).map((t) => ({ tab, t }))
          ).map(({ tab, t }, i) => (
              <li key={`${tab.id}-${i}`} className="flex gap-4 text-base leading-relaxed">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <span>
                  <strong className="text-foreground">{tab.title} — </strong>
                  {t}
                </span>
              </li>
            ))}
        </ol>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Coût pour acquérir un client</h3>
        <ul className="mt-4 space-y-3">
          {opportunity.cacChannels.map((c) => (
            <li key={c.channel} className="flex justify-between gap-4 text-base border-b border-border pb-3">
              <span>{c.channel}</span>
              <span className="font-semibold tabular-nums">≈ {formatCurrency(c.estimate)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Concurrents déjà en France ({competitors.length})</h3>
        <ul className="mt-4 space-y-3">
          {competitors.slice(0, 4).map((c) => (
            <li key={c.name} className="rounded-lg border border-border p-4 text-base">
              <span className="font-semibold">{c.name}</span>
              <span className="text-muted-foreground"> — {c.weakness}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <SectionShell
      id="clients"
      step={6}
      title="Trouvez vos premiers clients"
      subtitle="Actions concrètes et ordre dans lequel les faire"
      requiredTier="builder"
      variant="premium"
    >
      <PaywallGate
        requiredTier="builder"
        preview={<p>Canaux, coûts par client, et liste des concurrents français</p>}
        message="Découvrez comment contacter vos premiers clients sans tâtonner"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}
