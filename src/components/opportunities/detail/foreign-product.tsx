import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";

export function ForeignProduct({ opportunity }: { opportunity: Opportunity }) {
  const profile = opportunity.foreignMarketProfile!;

  const content = (
    <div className="space-y-10">
      <div className="rounded-xl border border-border bg-muted/30 p-6 sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">
          {profile.flag} {profile.country} · Référence : {opportunity.foreignInspiration}
        </p>
        <h3 className="mt-3 font-display text-2xl font-medium">{profile.productName}</h3>
        <p className="mt-3 text-lg leading-relaxed">{profile.tagline}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Le problème qu&apos;il résout</h3>
        <p className="mt-3 text-base leading-relaxed">{profile.problemSolved}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold">Clients cibles</h3>
          <p className="mt-3 text-base leading-relaxed">{profile.targetUsers}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Modèle économique</h3>
          <p className="mt-3 text-base leading-relaxed">{profile.businessModel}</p>
          <p className="mt-4 text-base">
            <span className="font-medium text-foreground">Tarification :</span>{" "}
            <span className="text-primary">{profile.pricing}</span>
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Comment ça fonctionne</h3>
        <p className="mt-3 text-base leading-relaxed">{profile.howItWorks}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Fonctionnalités clés</h3>
        <ul className="mt-4 space-y-3">
          {profile.keyFeatures.map((f) => (
            <li key={f} className="flex gap-3 text-base">
              <span className="text-primary">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Pourquoi ça marche là-bas</h3>
        <ul className="mt-4 space-y-4 text-base leading-relaxed">
          {profile.whyItWorksThere.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-data text-sm font-semibold text-primary">{i + 1}.</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Signaux de traction</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {profile.tractionHighlights.map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-xl font-medium tabular-nums text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.source}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <SectionShell
      id="foreign"
      step={4}
      title={`Description complète de ${profile.productName}`}
      subtitle={`Le SaaS  tel qu'il fonctionne en ${profile.country}`}
      requiredTier="builder"
      variant="premium"
    >
      <PaywallGate
        requiredTier="builder"
        preview={
          <p>
            {profile.productName} ({profile.country}) — {profile.keyFeatures.length} fonctionnalités, tarifs et
            signaux de traction du marché source
          </p>
        }
        message="Comprenez le produit d'origine avant de l'adapter en France"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}
