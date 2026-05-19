import { Suspense } from "react";
import { WorldMapExplorer } from "@/components/world/world-map";
import { TargetMarketProvider } from "@/context/target-market-context";

export const metadata = {
  title: "Carte mondiale — SaaS Radar",
  description:
    "Intelligence micro-SaaS mondiale : trends, top revenus et potentiel d'import vers le marché de votre choix.",
};

function WorldMapFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0A0A0A] text-zinc-500">
      Chargement de la carte…
    </div>
  );
}

export default function WorldPage() {
  return (
    <TargetMarketProvider>
      <Suspense fallback={<WorldMapFallback />}>
        <WorldMapExplorer />
      </Suspense>
    </TargetMarketProvider>
  );
}
