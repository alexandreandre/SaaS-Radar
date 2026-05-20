import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { cn } from "@/lib/utils";

const impactStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/10 text-destructive",
};

export function CompetitionWatch({ opportunity }: { opportunity: Opportunity }) {
  const alerts = opportunity.competitionAlerts ?? [];

  const content = (
    <ul className="space-y-3">
      {alerts.map((a) => (
        <li key={a.title} className="flex flex-wrap items-start gap-3 rounded-lg border border-border p-4 text-sm">
          <span className="font-data text-[10px] text-muted-foreground">{a.date}</span>
          <span className="flex-1 font-medium">{a.title}</span>
          <span
            className={cn(
              "rounded-sm px-2 py-0.5 font-data text-[10px] font-medium uppercase tracking-data",
              impactStyles[a.impact]
            )}
          >
            {a.impact}
          </span>
        </li>
      ))}
      <li className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        Newsletter hebdo + alertes Slack — activées avec Pro
      </li>
    </ul>
  );

  return (
    <SectionShell
      id="watch"
      title="Veille concurrence"
      subtitle="Restez informé des mouvements sur votre niche"
      requiredTier="pro"
      variant="pro"
    >
      <PaywallGate
        requiredTier="pro"
        preview={<p className="text-sm text-muted-foreground">{alerts.length} alertes récentes sur cette niche</p>}
        message="Fil d'alertes et veille automatisée — Pro"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}
