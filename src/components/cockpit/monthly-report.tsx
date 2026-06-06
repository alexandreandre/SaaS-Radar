"use client";

import { useCallback } from "react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitMetrics } from "@/lib/cockpit-metrics";
import { buildCockpitAlerts } from "@/lib/cockpit-alerts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

type MonthlyReportProps = {
  project: UserProject;
  opportunity: Opportunity;
  metrics: CockpitMetrics;
};

export function MonthlyReport({ project, opportunity, metrics }: MonthlyReportProps) {
  const alerts = buildCockpitAlerts(project, metrics, opportunity);
  const latest = metrics.latest;

  const exportPdf = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const month = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    doc.setFontSize(18);
    doc.text(`Rapport mensuel — ${opportunity.name}`, 14, 20);
    doc.setFontSize(11);
    doc.text(month, 14, 28);
    doc.text(`Phase : ${project.phase} · Scénario : ${project.targetScenario}`, 14, 36);

    let y = 48;
    doc.setFontSize(12);
    doc.text("KPIs clés", 14, y);
    y += 8;
    doc.setFontSize(10);
    const lines = [
      `MRR : ${formatCurrency(latest?.mrr ?? project.currentMrr)}`,
      `ARR : ${formatCurrency(metrics.arr)}`,
      `Clients : ${latest?.customers ?? 0}`,
      `MAU : ${latest?.mau ?? 0}`,
      `LTV/CAC : ${metrics.ltvCacRatio}x`,
      `ROAS : ${metrics.roas}x`,
      `Runway : ${metrics.runwayMonths ?? "—"} mois`,
    ];
    for (const line of lines) {
      doc.text(line, 14, y);
      y += 6;
    }

    y += 6;
    doc.setFontSize(12);
    doc.text("Alertes", 14, y);
    y += 8;
    doc.setFontSize(10);
    if (alerts.length === 0) {
      doc.text("Aucune alerte ce mois-ci.", 14, y);
    } else {
      for (const alert of alerts.slice(0, 5)) {
        const wrapped = doc.splitTextToSize(`• ${alert.message}`, 180);
        doc.text(wrapped, 14, y);
        y += wrapped.length * 6;
      }
    }

    doc.save(`rapport-${opportunity.slug}-${new Date().toISOString().slice(0, 7)}.pdf`);
  }, [project, opportunity, metrics, alerts, latest]);

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">Rapport mensuel</p>
      <h2 className="mt-1 text-lg font-semibold">
        Bilan {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ReportLine label="MRR" value={formatCurrency(latest?.mrr ?? project.currentMrr)} />
        <ReportLine label="Clients" value={String(latest?.customers ?? 0)} />
        <ReportLine label="LTV / CAC" value={`${metrics.ltvCacRatio}x`} />
        <ReportLine
          label="Runway"
          value={metrics.runwayMonths !== null ? `${metrics.runwayMonths} mois` : "—"}
        />
      </div>
      {alerts.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {alerts.slice(0, 3).map((a) => (
            <li key={a.id}>• {a.message}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-emerald-700">Trajectoire saine ce mois-ci.</p>
      )}
      <Button className="mt-6 gap-2" variant="outline" onClick={exportPdf}>
        <FileDown className="h-4 w-4" />
        Exporter en PDF
      </Button>
    </section>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-data font-semibold">{value}</p>
    </div>
  );
}
