import { PortfolioSyncStatus } from "@/components/portfolio/portfolio-sync-status";

export function MesSaasHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="font-data text-[10px] uppercase tracking-data text-primary">
          Espace builder
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight">Mes SaaS</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Vos projets en cours et vos opportunités favorites.
        </p>
      </div>
      <PortfolioSyncStatus className="mt-1" />
    </div>
  );
}
