import type { Opportunity, TechComplexity } from "@/types/opportunity";
import { CheckCircle, Lock } from "lucide-react";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { StatCard } from "@/components/opportunities/detail/stat-card";
import { LockedSection } from "@/components/opportunities/detail/locked-section";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";
import { DetailPaywall } from "@/components/opportunities/detail/detail-paywall";

const techComplexityLabels: Record<TechComplexity, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
};

function getSaasOriginePreview(opportunity: Opportunity): string {
  const signals = opportunity.tractionSignals.slice(0, 2);
  const lines = [
    `${opportunity.foreignInspiration}`,
    ...signals.map((s) => `${s.label}: ${s.value} (${s.source})`),
    opportunity.whyItWorks[0] ?? "Le modèle a déjà prouvé une traction forte sur son marché d'origine.",
  ];
  return lines.filter(Boolean).slice(0, 4).join("\n");
}

function getFinancialPreview(opportunity: Opportunity): string {
  const scenarioLines = opportunity.financialScenarios
    .map(
      (s) =>
        `${s.name}: ${s.mrr.toLocaleString("fr-FR")}€ MRR/mois · ${s.clients} clients × ${s.avgPrice}€ · marge ${s.grossMargin}%`
    )
    .slice(0, 3);

  const realistic = opportunity.financialScenarios.find((s) => s.name === "Réaliste");
  if (realistic) {
    scenarioLines.push(
      `Projection annuelle (Réaliste): ${(realistic.mrr * 12).toLocaleString("fr-FR")}€ de revenus récurrents`
    );
  }

  return scenarioLines.slice(0, 4).join("\n");
}

function getAcquisitionPreview(opportunity: Opportunity): string {
  const channelLines = opportunity.cacChannels
    .slice(0, 3)
    .map((c) => `${c.channel} — ~${c.estimate}€ CAC · ${c.note}`)
    .slice(0, 3);
  const avgCac = Math.round(
    opportunity.cacChannels.slice(0, 3).reduce((acc, c) => acc + c.estimate, 0) /
      Math.max(1, opportunity.cacChannels.slice(0, 3).length)
  );
  channelLines.push(`CAC moyen estimé des 3 canaux prioritaires: ~${avgCac}€`);
  return channelLines.slice(0, 4).join("\n");
}

function getPromptPreview(opportunity: Opportunity): string {
  const lines = opportunity.claudePrompt
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
  return lines.join("\n");
}

function getGuidePreview(opportunity: Opportunity): string {
  return opportunity.mvpPlan.roadmap
    .map((r) => `${r.day} — ${r.tasks.join(", ")}`)
    .slice(0, 4)
    .join("\n");
}

function getSectionTeasers(opportunity: Opportunity): Record<string, string> {
  const realistic =
    opportunity.financialScenarios.find((s) => s.name === "Réaliste") ??
    opportunity.financialScenarios[1];
  const firstChannel = opportunity.cacChannels[0];

  return {
    "saas-origine": `"${opportunity.foreignInspiration} facture 299-599$/mois — voici exactement comment ils ont structuré leur produit..."`,
    financier: `"Scénario réaliste : ${realistic?.mrr?.toLocaleString("fr-FR")}€/mois avec ${realistic?.clients} clients — détail complet ci-dessous..."`,
    acquisition: `"CAC moyen estimé à ${firstChannel?.estimate}€ via ${firstChannel?.channel} — voici les 3 canaux qui convertissent le mieux..."`,
    prompt:
      '"Prompt complet pour générer ce SaaS en une session Cursor ou Claude Code — testé et validé par nos abonnés Pro..."',
    guide:
      '"J1 : Setup repo + auth. J3 : Core MVP. J6 : Dashboard. J14 : 5 premiers clients — le plan jour par jour..."',
  };
}

export function DetailContent({ opportunity }: { opportunity: Opportunity }) {
  const techComplexity = techComplexityLabels[opportunity.techComplexity];
  const extraSignalsCount = Math.max(0, opportunity.tractionSignals.length - 2);
  const sectionTeasers = getSectionTeasers(opportunity);

  return (
    <>
      <AnimatedSection id="opportunite" animationIndex={0} className="mb-12 scroll-mt-24">
        <SectionTitle number={1} title="L'opportunité" locked={false} />

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Entrepreneurs qui le font"
            value={String(opportunity.entrepreneursBuilding)}
            icon="👥"
          />
          <StatCard label="Complexité technique" value={techComplexity} icon="⚙️" />
          <StatCard
            label="Lançable en 30 jours"
            value={opportunity.buildableUnder30Days ? "Oui" : "Non"}
            icon="📅"
          />
        </div>

        {opportunity.foreignInspiration && (
          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="mb-1 text-xs text-gray-500">Inspiré de</p>
            <p className="text-gray-300">{opportunity.foreignInspiration}</p>
          </div>
        )}
      </AnimatedSection>

      <AnimatedSection id="pourquoi" animationIndex={1} className="mb-12 scroll-mt-24">
        <SectionTitle number={2} title="Pourquoi ça marche" locked={false} />
        <p className="mb-4 text-sm text-gray-500">
          Ce business existe déjà — et cartonne à l&apos;étranger
        </p>

        <div className="space-y-3">
          {opportunity.whyItWorks.map((item, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <p className="text-sm text-gray-300">{item}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection id="chiffres" animationIndex={2} className="mb-12 scroll-mt-24">
        <SectionTitle number={3} title="Le marché en chiffres" locked={false} />
        <p className="mb-4 text-sm text-gray-500">Les preuves que l&apos;opportunité est réelle</p>

        <div className="grid grid-cols-2 gap-4">
          {opportunity.tractionSignals.slice(0, 2).map((signal, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-2 text-xs text-gray-500">{signal.label}</p>
              <p className="text-2xl font-bold text-blue-400">{signal.value}</p>
              <p className="mt-1 text-xs text-gray-600">Source : {signal.source}</p>
            </div>
          ))}
        </div>

        {extraSignalsCount > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
            <Lock className="h-3 w-3" />+{extraSignalsCount} autres signaux disponibles avec
            l&apos;abonnement Builder
          </p>
        )}
      </AnimatedSection>

      <LockedSection
        id="saas-origine"
        number={4}
        title="Le SaaS aux US"
        plan="BUILDER"
        description="Le SaaS tel qu'il existe sur son marché d'origine — fonctionnalités, pricing, traction réelle."
        preview={getSaasOriginePreview(opportunity)}
        teaser={sectionTeasers["saas-origine"]}
        animationIndex={3}
      />

      <LockedSection
        id="financier"
        number={5}
        title="Potentiel financier"
        plan="BUILDER"
        description="Scénarios Prudent, Réaliste et Optimiste — MRR, clients, prix moyen et marge brute."
        preview={getFinancialPreview(opportunity)}
        teaser={sectionTeasers.financier}
        animationIndex={4}
      />

      <LockedSection
        id="acquisition"
        number={6}
        title="Trouver tes clients"
        plan="BUILDER"
        description="Canaux d'acquisition testés en France — coûts CAC, notes tactiques et priorités."
        preview={getAcquisitionPreview(opportunity)}
        teaser={sectionTeasers.acquisition}
        animationIndex={5}
      />

      <LockedSection
        id="prompt"
        number={7}
        title="Prompt Claude Code"
        plan="PRO"
        description="Prompt prêt à coller dans Claude Code pour générer le MVP en quelques heures."
        preview={getPromptPreview(opportunity)}
        teaser={sectionTeasers.prompt}
        animationIndex={6}
      />

      <LockedSection
        id="guide"
        number={8}
        title="Guide J1 → J14"
        plan="BUILDER"
        description="Roadmap jour par jour — exactement quoi construire et livrer chaque étape."
        preview={getGuidePreview(opportunity)}
        teaser={sectionTeasers.guide}
        animationIndex={7}
      />

      <DetailPaywall />
    </>
  );
}
