"use client";

import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";

export function AcquisitionPlan({ opportunity }: { opportunity: Opportunity }) {
  const templates = opportunity.emailTemplates ?? [];
  const partners = opportunity.partnersFR ?? [];

  const builderContent = (
    <>
      <Tabs defaultValue={opportunity.acquisition[0]?.id}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {opportunity.acquisition.map((a) => (
            <TabsTrigger key={a.id} value={a.id}>
              {a.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {opportunity.acquisition.map((a) => (
          <TabsContent key={a.id} value={a.id} className="mt-4">
            <ul className="space-y-3">
              {a.tactics.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent font-data text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
      <div className="mt-8">
        <h3 className="text-sm font-semibold">CAC par canal</h3>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 font-medium">Canal</th>
              <th className="pb-2 font-medium">CAC estimé</th>
              <th className="pb-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {opportunity.cacChannels.map((c) => (
              <tr key={c.channel} className="border-b border-border last:border-0">
                <td className="py-3">{c.channel}</td>
                <td className="py-3 font-semibold tabular-nums">≈ {formatCurrency(c.estimate)}</td>
                <td className="py-3 text-muted-foreground">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const proTemplates = (
    <div className="mt-8 space-y-4">
      <h3 className="text-sm font-semibold">Templates emails prêts à copier</h3>
      {templates.map((t) => (
        <div key={t.name} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{t.name}</p>
            <CopyButton text={`Objet: ${t.subject}\n\n${t.body}`} />
          </div>
          <p className="mt-2 font-data text-xs text-muted-foreground">Objet : {t.subject}</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{t.body}</pre>
        </div>
      ))}
    </div>
  );

  const proPartners = (
    <div className="mt-8">
      <h3 className="text-sm font-semibold">Partenaires FR à contacter</h3>
      <ul className="mt-4 space-y-3">
        {partners.map((p) => (
          <li key={p.name} className="rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.type}</p>
            <p className="mt-1 text-muted-foreground">{p.angle}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <SectionShell
      id="acquisition"
      title="Plan d'acquisition"
      subtitle="4 canaux testés sur des niches similaires"
      requiredTier="builder"
    >
      <PaywallGate
        requiredTier="builder"
        preview={
          <p className="text-sm text-muted-foreground">
            {opportunity.acquisition.map((a) => a.title).join(" · ")} — tactiques + CAC chiffré
          </p>
        }
        message="Playbook complet canal par canal avec CAC estimé"
      >
        {builderContent}
      </PaywallGate>

      <PaywallGate
        requiredTier="pro"
        className="mt-6 rounded-lg border border-primary/20 p-4"
        preview={<p className="text-sm text-muted-foreground">3 séquences email + {partners.length} partenaires FR</p>}
        message="Templates copy-paste et liste de partenaires — Pro"
      >
        {proTemplates}
        {proPartners}
      </PaywallGate>
    </SectionShell>
  );
}
