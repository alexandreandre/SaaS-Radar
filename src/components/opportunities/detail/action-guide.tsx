import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { CopyButton } from "@/components/ui/copy-button";
import { totalInfraMonthly } from "@/data/opportunity-enrichment";
import { formatCurrency } from "@/lib/utils";

const integrations = [
  { name: "Stripe", desc: "Encaisser les abonnements", status: "Recommandé" },
  { name: "Google Calendar", desc: "Sync des rendez-vous", status: "Optionnel" },
  { name: "Doctolib", desc: "Prise de RDV (secteur santé)", status: "Si santé" },
  { name: "Resend", desc: "Emails automatiques", status: "Recommandé" },
];

export function ActionGuide({ opportunity }: { opportunity: Opportunity }) {
  const costs = opportunity.infraCosts ?? [];
  const monthly = totalInfraMonthly(costs);
  const weeks = opportunity.launchTimeline ?? [];
  const templates = opportunity.emailTemplates ?? [];
  const partners = opportunity.partnersFR ?? [];

  const content = (
    <div className="space-y-12">
      <div>
        <h3 className="text-lg font-semibold">À faire en version 1</h3>
        <ul className="mt-4 space-y-3 text-base">
          {opportunity.mvpPlan.features.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="text-primary">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold">À reporter (ne pas faire tout de suite)</h3>
        <ul className="mt-4 space-y-2 text-base text-muted-foreground">
          {opportunity.mvpPlan.notYet.map((f) => (
            <li key={f}>— {f}</li>
          ))}
        </ul>
      </div>
      <p className="text-base">
        <span className="font-medium">Outils conseillés :</span> {opportunity.mvpPlan.stack.join(", ")}
      </p>
      <p className="text-base text-muted-foreground">
        Budget technique estimé : <strong className="text-foreground">{formatCurrency(monthly)}/mois</strong>
      </p>

      <div>
        <h3 className="text-lg font-semibold">Plan semaine par semaine</h3>
        <ol className="mt-6 space-y-4">
          {weeks.map((w) => (
            <li key={w.week} className="rounded-lg border border-border p-5">
              <p className="font-semibold">
                Semaine {w.week} — {w.goal}
              </p>
              <ul className="mt-3 space-y-2 text-base text-muted-foreground">
                {w.actions.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium text-primary">Objectif : {w.kpi}</p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Roadmap technique (14 jours)</h3>
        <ol className="mt-4 space-y-3">
          {opportunity.mvpPlan.roadmap.map((r) => (
            <li key={r.day} className="rounded-lg border border-border px-5 py-4 text-base">
              <span className="font-semibold text-primary">{r.day}</span>
              <span className="text-muted-foreground"> — {r.tasks.join(" · ")}</span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Emails prêts à envoyer</h3>
        <p className="mt-2 text-base text-muted-foreground">Copiez, personnalisez le prénom, envoyez.</p>
        <div className="mt-6 space-y-4">
          {templates.map((t) => (
            <div key={t.name} className="rounded-lg border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold">{t.name}</p>
                <CopyButton text={`Objet: ${t.subject}\n\n${t.body}`} />
              </div>
              <p className="mt-2 text-base text-muted-foreground">Objet : {t.subject}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Partenaires à contacter en France</h3>
        <ul className="mt-6 space-y-4">
          {partners.map((p) => (
            <li
              key={p.name}
              className="flex flex-col gap-1 rounded-lg border border-border p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-lg font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.type}</p>
              </div>
              <p className="text-base text-primary sm:max-w-xs sm:text-right">{p.angle}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Branchements utiles</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {integrations.map((int) => (
            <div
              key={int.name}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-5 py-4"
            >
              <div>
                <p className="font-semibold">{int.name}</p>
                <p className="text-sm text-muted-foreground">{int.desc}</p>
              </div>
              <span className="text-xs font-medium text-primary">{int.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <SectionShell
      id="guide"
      step={7}
      title="Guide d'action complet"
      subtitle="MVP, plan 4 semaines, emails, partenaires et outils — tout pour lancer"
      requiredTier="pro"
      variant="pro"
    >
      <PaywallGate
        requiredTier="pro"
        preview={
          <p className="text-base">
            {opportunity.mvpPlan.features.length} features · plan 4 semaines · {templates.length} emails ·{" "}
            {partners.length} partenaires
          </p>
        }
        message="Recevez le guide d'exécution complet pour passer à l'action"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}
