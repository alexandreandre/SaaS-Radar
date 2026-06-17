import { AlertCircle } from "lucide-react";
import Link from "next/link";
import type { PortfolioStats } from "@/lib/portfolio";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PortfolioStatsBar({ stats }: { stats: PortfolioStats }) {
  if (stats.projectCount === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Projets actifs" value={String(stats.activeCount)} />
      <StatCard label="MRR total réel" value={formatCurrency(stats.totalMrr)} />
      <StatCard
        label="Progression moyenne"
        value={`${stats.averageProgressPercent} %`}
        hint="vers scénario réaliste"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CheckInBanner({ overdueCount }: { overdueCount: number }) {
  if (overdueCount === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-foreground">Il est temps de mettre à jour vos chiffres</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {overdueCount === 1
              ? "1 projet n'a pas eu de check-in MRR depuis plus de 25 jours."
              : `${overdueCount} projets n'ont pas eu de check-in MRR depuis plus de 25 jours.`}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" asChild className="shrink-0 border-amber-500/40">
        <Link href="#projets">Mettre à jour</Link>
      </Button>
    </div>
  );
}
