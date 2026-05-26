import type { Opportunity } from "@/types/opportunity";
import { CheckCircle, Lock } from "lucide-react";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { LockedSection } from "@/components/opportunities/detail/locked-section";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";
import { DetailPaywall } from "@/components/opportunities/detail/detail-paywall";
import { OpportunitySimulator } from "@/components/opportunities/detail/opportunity-simulator";

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
  const { tractionSignals } = opportunity;
  const sectionTeasers = getSectionTeasers(opportunity);

  return (
    <>
      <AnimatedSection id="opportunite" animationIndex={0} className="mb-12 scroll-mt-24">
        <SectionTitle number={1} title="L'opportunité" locked={false} />

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <tbody>
              {[
                {
                  label: "Marché d'origine",
                  value: `${opportunity.originFlag} ${opportunity.originCountry}`,
                },
                { label: "Inspiré de", value: opportunity.foreignInspiration },
                { label: "Client cible", value: opportunity.targetClient },
                {
                  label: "Complexité technique",
                  value:
                    opportunity.techComplexity === "low"
                      ? "Faible"
                      : opportunity.techComplexity === "medium"
                        ? "Moyenne"
                        : "Élevée",
                },
                {
                  label: "Lançable en 30 jours",
                  value: opportunity.buildableUnder30Days ? "✅ Oui" : "❌ Non",
                },
                {
                  label: "Entrepreneurs qui le font",
                  value: `${opportunity.entrepreneursBuilding} dans le monde`,
                },
                {
                  label: "Type de client",
                  value: opportunity.clientType === "b2b" ? "B2B" : "B2C",
                },
                {
                  label: "Concurrence en France",
                  value:
                    opportunity.franceCompetition === "none"
                      ? "Aucune"
                      : opportunity.franceCompetition === "low"
                        ? "Faible"
                        : opportunity.franceCompetition === "medium"
                          ? "Moyenne"
                          : "Élevée",
                },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-900/40" : "bg-gray-900/20"}>
                  <td className="w-1/2 px-4 py-3 font-medium text-gray-500">{row.label}</td>
                  <td className="px-4 py-3 text-gray-200">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedSection>

      <AnimatedSection id="chiffres" animationIndex={1} className="mb-12 scroll-mt-24">
        <SectionTitle
          number={2}
          title="Ce que gagne déjà le concurrent US 💰"
          locked={false}
        />

        <p className="mb-8 text-base leading-relaxed text-gray-300">
          <span className="font-semibold text-white">{opportunity.foreignInspiration}</span> existe
          depuis 3 ans aux États-Unis. Voici ce qu&apos;ils font chaque mois — et pourquoi personne
          ne le fait encore en France.
        </p>

        <div className="flex items-center justify-between border-b border-gray-800 py-5">
          <div>
            <p className="text-lg font-semibold text-white">Revenu mensuel (MRR)</p>
            <p className="mt-0.5 text-sm text-gray-500">Ce qu&apos;ils encaissent chaque mois</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-green-400">{tractionSignals[0]?.value}</p>
            <p className="mt-1 text-xs text-gray-600">Source : {tractionSignals[0]?.source}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 py-5">
          <div>
            <p className="text-lg font-semibold text-white">{tractionSignals[1]?.label}</p>
            <p className="mt-0.5 text-sm text-gray-500">Autorité et visibilité en ligne</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-blue-400">{tractionSignals[1]?.value}</p>
            <p className="mt-1 text-xs text-gray-600">Source : {tractionSignals[1]?.source}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-800 py-5">
          <div>
            <p className="text-lg font-semibold text-white">{tractionSignals[2]?.label}</p>
            <p className="mt-0.5 text-sm text-gray-500">Communauté et bouche-à-oreille</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-purple-400">{tractionSignals[2]?.value}</p>
            <p className="mt-1 text-xs text-gray-600">Source : {tractionSignals[2]?.source}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-green-800/30 bg-green-950/20 p-5">
          <p className="mb-1 text-sm font-semibold text-green-400">🇫🇷 Et en France ?</p>
          <p className="text-sm leading-relaxed text-gray-300">
            Concurrence{" "}
            <span className="font-medium text-white">
              {opportunity.franceCompetition === "none"
                ? "inexistante"
                : opportunity.franceCompetition === "low"
                  ? "très faible"
                  : "limitée"}
            </span>
            . Le marché existe, la douleur est réelle — personne n&apos;a encore structuré la
            solution.
          </p>
        </div>

        {tractionSignals.length > 3 && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-600">
            <Lock className="h-3 w-3" />+ {tractionSignals.length - 3} autres signaux disponibles
            avec l&apos;abonnement Builder
          </p>
        )}
      </AnimatedSection>

      <OpportunitySimulator opportunity={opportunity} />

      <AnimatedSection id="pourquoi" animationIndex={3} className="mb-12 scroll-mt-24">
        <SectionTitle number={4} title="Pourquoi ça marche" locked={false} />
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

      <LockedSection
        id="saas-origine"
        number={5}
        title="Le SaaS aux US"
        plan="BUILDER"
        description="Le SaaS tel qu'il existe sur son marché d'origine — fonctionnalités, pricing, traction réelle."
        preview={getSaasOriginePreview(opportunity)}
        teaser={sectionTeasers["saas-origine"]}
        animationIndex={4}
      />

      <LockedSection
        id="financier"
        number={6}
        title="Potentiel financier"
        plan="BUILDER"
        description="Scénarios Prudent, Réaliste et Optimiste — MRR, clients, prix moyen et marge brute."
        preview={getFinancialPreview(opportunity)}
        teaser={sectionTeasers.financier}
        animationIndex={5}
      />

      <LockedSection
        id="acquisition"
        number={7}
        title="Trouver tes clients"
        plan="BUILDER"
        description="Canaux d'acquisition testés en France — coûts CAC, notes tactiques et priorités."
        preview={getAcquisitionPreview(opportunity)}
        teaser={sectionTeasers.acquisition}
        animationIndex={6}
      />

      <LockedSection
        id="prompt"
        number={8}
        title="Prompt Claude Code"
        plan="PRO"
        description="Prompt prêt à coller dans Claude Code pour générer le MVP en quelques heures."
        preview={getPromptPreview(opportunity)}
        teaser={sectionTeasers.prompt}
        animationIndex={7}
      />

      <LockedSection
        id="guide"
        number={9}
        title="Guide J1 → J14"
        plan="BUILDER"
        description="Roadmap jour par jour — exactement quoi construire et livrer chaque étape."
        preview={getGuidePreview(opportunity)}
        teaser={sectionTeasers.guide}
        animationIndex={8}
      />

      <DetailPaywall />
    </>
  );
}
