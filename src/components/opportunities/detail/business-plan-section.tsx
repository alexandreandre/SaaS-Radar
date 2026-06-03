"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { getWhyItWorksFact } from "@/types/opportunity";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface BusinessPlanSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

const DEFAULT_STACK = ["Next.js 14", "Supabase", "Stripe", "Tailwind CSS"];

function sanitizePdfText(text: string): string {
  return text.replace(/[^\x00-\x7F]/g, (c) => {
    const map: Record<string, string> = { "€": "EUR", "★": "*", "→": "->", "✓": "v" };
    return map[c] ?? "";
  });
}

function franceCompetitionLabel(competition: Opportunity["franceCompetition"]): string {
  if (competition === "none") return "Aucune";
  if (competition === "low") return "Faible";
  if (competition === "medium") return "Moyenne";
  return "Élevée";
}

export function BusinessPlanSection({ opportunity, animationIndex }: BusinessPlanSectionProps) {
  const realistic = opportunity.financialScenarios.find((s) => s.name === "Réaliste");

  const [price, setPrice] = useState(realistic?.avgPrice ?? 79);
  const [churn, setChurn] = useState(5);
  const [cac, setCac] = useState(opportunity.cacChannels[0]?.estimate ?? 120);
  const [newClients, setNewClients] = useState(
    realistic ? Math.round(realistic.clients / 12) : 8,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  let clients = 0;
  let mrr12 = 0;
  for (let m = 1; m <= 12; m++) {
    clients = clients * (1 - churn / 100) + newClients;
    mrr12 = Math.round(clients * price);
  }
  const ltv = Math.round(price / (churn / 100));
  const ltvcac = (ltv / cac).toFixed(1);
  const breakEven = Math.ceil(cac / (price * (1 - churn / 100)));

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const checkPage = () => {
        if (y > 270) {
          doc.addPage();
          doc.setFillColor(10, 10, 15);
          doc.rect(0, 0, 210, 297, "F");
          y = 20;
        }
      };

      const addSectionTitle = (title: string) => {
        checkPage();
        y += 4;
        doc.setFillColor(25, 35, 60);
        doc.roundedRect(margin, y - 4, contentWidth, 9, 1, 1, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 140, 255);
        doc.text(title, margin + 3, y + 2);
        y += 10;
      };

      const addLine = (
        label: string,
        value: string,
        valueColor: [number, number, number] = [200, 200, 200],
      ) => {
        checkPage();
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 140);
        doc.text(label, margin + 2, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
        doc.text(value, margin + 60, y);
        y += 6;
      };

      const addParagraph = (text: string) => {
        checkPage();
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 200);
        const lines = doc.splitTextToSize(text, contentWidth - 4);
        doc.text(lines, margin + 2, y);
        y += lines.length * 5 + 2;
      };

      const addBullet = (text: string) => {
        checkPage();
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 200);
        const lines = doc.splitTextToSize(`- ${text}`, contentWidth - 8);
        doc.text(lines, margin + 4, y);
        y += lines.length * 5 + 1;
      };

      doc.setFillColor(10, 10, 15);
      doc.rect(0, 0, 210, 297, "F");

      doc.setFillColor(15, 20, 40);
      doc.rect(0, 0, 210, 38, "F");
      doc.setFillColor(60, 100, 255);
      doc.rect(0, 0, 4, 38, "F");
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("BUSINESS PLAN", margin, 14);
      doc.setFontSize(11);
      doc.setTextColor(100, 160, 255);
      doc.text(sanitizePdfText(opportunity.name), margin, 23);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 120);
      doc.text(
        `SaaS Radar  |  saasradar.fr  |  ${new Date().toLocaleDateString("fr-FR")}`,
        margin,
        31,
      );
      y = 46;

      addSectionTitle("01 — RESUME EXECUTIF");
      addParagraph(sanitizePdfText(opportunity.pitch));
      addLine("Marche cible", sanitizePdfText(opportunity.targetClient));
      addLine("Inspire de", sanitizePdfText(opportunity.foreignInspiration));
      addLine("Secteur", opportunity.sector);
      addLine("Type", opportunity.clientType.toUpperCase());

      addSectionTitle("02 — OPPORTUNITE MARCHE");
      addLine("Score global", `${opportunity.scores.opportunity}/100`, [100, 200, 100]);
      addLine("Adapte France", `${opportunity.scores.franceFit}/10`);
      addLine("Facilite", `${opportunity.scores.buildability}/10`);
      addLine(
        "Concurrence FR",
        franceCompetitionLabel(opportunity.franceCompetition),
        [100, 200, 100],
      );
      addLine(
        "Lancement",
        opportunity.buildableUnder30Days ? "< 30 jours" : "30-60 jours",
        [100, 200, 100],
      );

      addSectionTitle("03 — PREUVE MARCHE US");
      opportunity.tractionSignals.forEach((s) => {
        addLine(s.label, `${sanitizePdfText(s.value)} (${sanitizePdfText(s.source)})`);
      });

      addSectionTitle("04 — POURQUOI CA MARCHE");
      opportunity.whyItWorks.forEach((item) => {
        addBullet(sanitizePdfText(getWhyItWorksFact(item)));
      });

      addSectionTitle("05 — MODELE FINANCIER");
      opportunity.financialScenarios.forEach((s) => {
        checkPage();
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        if (s.name === "Prudent") {
          doc.setTextColor(255, 200, 50);
        } else if (s.name === "Réaliste") {
          doc.setTextColor(100, 200, 100);
        } else {
          doc.setTextColor(100, 160, 255);
        }
        doc.text(`${s.name} :`, margin + 2, y);
        y += 5;
        addLine("  MRR", `${s.mrr.toLocaleString("fr-FR")} EUR/mois`);
        addLine("  Clients", `${s.clients}`);
        addLine("  Prix moyen", `${s.avgPrice} EUR/mois`);
        addLine("  Marge brute", `${s.grossMargin}%`);
        y += 2;
      });

      addSectionTitle("06 — SIMULATION PERSONNALISEE");
      addLine("Prix", `${price} EUR/mois`);
      addLine("Nouveaux clients/mois", `${newClients}`);
      addLine("Churn", `${churn}%`);
      addLine("CAC", `${cac} EUR`);
      addLine("MRR a 12 mois", `${mrr12.toLocaleString("fr-FR")} EUR`, [100, 200, 100]);
      addLine("Break-even", `Mois ${breakEven}`);
      addLine(
        "LTV/CAC",
        `${ltvcac}x`,
        Number(ltvcac) >= 3 ? [100, 200, 100] : [255, 200, 50],
      );
      addLine("LTV", `${ltv.toLocaleString("fr-FR")} EUR`);

      addSectionTitle("07 — STRATEGIE D'ACQUISITION");
      opportunity.cacChannels.forEach((c) => {
        addLine(c.channel, `CAC ~${c.estimate} EUR`);
        addBullet(sanitizePdfText(c.note));
      });

      addSectionTitle("08 — STACK TECHNIQUE");
      const stack = opportunity.mvpPlan.stack.length > 0 ? opportunity.mvpPlan.stack : DEFAULT_STACK;
      addParagraph(stack.join(" / "));

      addSectionTitle("09 — ROADMAP J1 -> J14");
      opportunity.mvpPlan.roadmap.forEach((step) => {
        checkPage();
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 160, 255);
        doc.text(`${step.day} :`, margin + 2, y);
        y += 5;
        step.tasks.forEach((task) => {
          addBullet(sanitizePdfText(task));
        });
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 20, 40);
        doc.rect(0, 287, 210, 10, "F");
        doc.setFillColor(60, 100, 255);
        doc.rect(0, 287, 4, 10, "F");
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 100);
        doc.text("SaaS Radar — saasradar.fr", margin, 293);
        doc.setTextColor(100, 100, 120);
        doc.text(`Page ${i}/${pageCount}`, pageWidth - margin, 293, { align: "right" });
      }

      doc.save(`business-plan-${opportunity.slug}.pdf`);
    } catch (error) {
      console.error("PDF error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const stack =
    opportunity.mvpPlan.stack.length > 0 ? opportunity.mvpPlan.stack : DEFAULT_STACK;

  return (
    <AnimatedSection
      id="business-plan"
      animationIndex={animationIndex}
      className="mb-12 scroll-mt-24"
    >
      <SectionTitle number={6} title="Business plan + Simulateur MRR" />

      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">Plan financier complet et projection personnalisée</p>
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Génération...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Télécharger le business plan
            </>
          )}
        </button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-4 text-xs uppercase tracking-widest text-gray-500">Résumé exécutif</p>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">{opportunity.pitch}</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-gray-500">Prix cible</p>
              <p className="text-xl font-bold text-white">
                {realistic?.avgPrice}€<span className="text-sm text-gray-500">/mois</span>
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Objectif 12 mois</p>
              <p className="text-xl font-bold text-white">{realistic?.clients} clients</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">MRR cible</p>
              <p className="text-xl font-bold text-green-400">
                {realistic?.mrr.toLocaleString("fr-FR")}€
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Marge brute</p>
              <p className="text-xl font-bold text-white">{realistic?.grossMargin}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-4 text-xs uppercase tracking-widest text-gray-500">
            Marché & Opportunité
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-gray-500">Score global</p>
              <p className="text-2xl font-black text-blue-400">
                {opportunity.scores.opportunity}
                <span className="text-sm text-gray-500">/100</span>
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Adapté France</p>
              <p className="text-2xl font-black text-white">
                {opportunity.scores.franceFit}
                <span className="text-sm text-gray-500">/10</span>
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Facilité</p>
              <p className="text-2xl font-black text-white">
                {opportunity.scores.buildability}
                <span className="text-sm text-gray-500">/10</span>
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Concurrence FR</p>
              <span className="rounded-full bg-green-500/10 px-2 py-1 text-sm font-semibold text-green-400">
                {franceCompetitionLabel(opportunity.franceCompetition)}
              </span>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Lancement</p>
              <span className="rounded-full bg-green-500/10 px-2 py-1 text-sm font-semibold text-green-400">
                {opportunity.buildableUnder30Days ? "< 30 jours" : "30-60 jours"}
              </span>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Type</p>
              <span className="rounded-full bg-blue-500/10 px-2 py-1 text-sm font-semibold text-blue-400">
                {opportunity.clientType.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-4 text-xs uppercase tracking-widest text-gray-500">
            Stratégie d&apos;acquisition
          </p>
          <div className="space-y-3">
            {opportunity.cacChannels.map((channel, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-gray-800 py-2 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-white">{channel.channel}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{channel.note}</p>
                </div>
                <span className="text-sm font-bold text-blue-400">~{channel.estimate}€ CAC</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-4 text-xs uppercase tracking-widest text-gray-500">
            Stack technique recommandée
          </p>
          <div className="flex flex-wrap gap-2">
            {stack.map((tech, i) => (
              <span
                key={i}
                className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">Simulateur MRR</p>
        <p className="mb-6 text-xs text-gray-600">
          Pré-rempli avec les données de {opportunity.foreignInspiration?.split(" ")[0]} — ajuste
          selon ta situation
        </p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            {[
              {
                label: "Prix / mois",
                value: price,
                setValue: setPrice,
                min: 9,
                max: 499,
                unit: "€",
              },
              {
                label: "Nouveaux clients / mois",
                value: newClients,
                setValue: setNewClients,
                min: 1,
                max: 100,
                unit: "",
              },
              {
                label: "Churn mensuel",
                value: churn,
                setValue: setChurn,
                min: 1,
                max: 30,
                unit: "%",
              },
              { label: "CAC", value: cac, setValue: setCac, min: 10, max: 1000, unit: "€" },
            ].map((slider, i) => (
              <div key={i}>
                <div className="mb-2 flex justify-between">
                  <label className="text-sm text-gray-400">{slider.label}</label>
                  <span className="text-sm font-semibold text-white">
                    {slider.value}
                    {slider.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={slider.value}
                  onChange={(e) => slider.setValue(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setPrice(realistic?.avgPrice ?? 79);
                setChurn(5);
                setCac(opportunity.cacChannels[0]?.estimate ?? 120);
                setNewClients(realistic ? Math.round(realistic.clients / 12) : 8);
              }}
              className="text-xs text-gray-600 transition-colors hover:text-gray-400"
            >
              ↺ Réinitialiser
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-5">
              <p className="mb-1 text-xs text-gray-500">MRR à 12 mois</p>
              <p className="text-4xl font-black text-green-400">
                {mrr12.toLocaleString("fr-FR")}€
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-center">
                <p className="mb-1 text-xs text-gray-500">Break-even</p>
                <p className="text-lg font-bold text-white">M{breakEven}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-center">
                <p className="mb-1 text-xs text-gray-500">LTV/CAC</p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    Number(ltvcac) >= 3 ? "text-green-400" : "text-yellow-400",
                  )}
                >
                  {ltvcac}x
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-center">
                <p className="mb-1 text-xs text-gray-500">LTV</p>
                <p className="text-lg font-bold text-white">{ltv.toLocaleString("fr-FR")}€</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
