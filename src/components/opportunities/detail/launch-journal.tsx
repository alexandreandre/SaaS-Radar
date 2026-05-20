import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";

export function LaunchJournal({ opportunity }: { opportunity: Opportunity }) {
  const weeks = opportunity.launchTimeline ?? [];

  const content = (
    <div className="space-y-4">
      {weeks.map((w) => (
        <details key={w.week} className="group rounded-lg border border-border bg-muted/30 open:bg-card">
          <summary className="cursor-pointer list-none px-4 py-3 font-medium">
            <span className="font-data text-[10px] uppercase tracking-data text-primary">Semaine {w.week}</span>
            <span className="ml-2">{w.goal}</span>
          </summary>
          <div className="border-t border-border px-4 pb-4 pt-2">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {w.actions.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-primary">·</span>
                  {a}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-data text-[10px] uppercase tracking-data text-muted-foreground">
              KPI : <span className="text-foreground">{w.kpi}</span>
            </p>
          </div>
        </details>
      ))}
    </div>
  );

  return (
    <SectionShell
      id="journal"
      title="Journal de lancement — 30 jours"
      subtitle="Semaine par semaine jusqu'au premier client"
      requiredTier="builder"
    >
      <PaywallGate
        requiredTier="builder"
        preview={
          <ul className="space-y-1 text-sm text-muted-foreground">
            {weeks.slice(0, 3).map((w) => (
              <li key={w.week}>
                S{w.week} — {w.goal}
              </li>
            ))}
          </ul>
        }
        message="Timeline 4 semaines avec actions et KPIs de validation"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}
