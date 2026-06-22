import Link from "next/link";
import { Radar } from "lucide-react";
import { MAP_EXPLORE_HREF } from "@/lib/map-routes";
import { isDiscoveryPhase } from "@/lib/product-phase";

export function Footer() {
  const discovery = isDiscoveryPhase();

  return (
    <footer className="border-t border-border bg-background py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-primary" aria-hidden />
              <p className="font-data text-xs font-medium uppercase tracking-[0.18em]">SaaS Radar</p>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Intelligence SaaS pour entrepreneurs français — opportunités validées, scores
              d&apos;import, carte mondiale.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <Link href={MAP_EXPLORE_HREF} className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              Carte du monde
            </Link>
            <Link href="/opportunities" className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              Opportunités
            </Link>
            <Link href="/weekly" className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              Pick hebdo
            </Link>
            <Link href="/simulator" className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              Simulateur
            </Link>
            {!discovery ? (
              <Link href="/mes-saas" className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                Mes SaaS
              </Link>
            ) : null}
            {discovery ? (
              <Link href="/newsletter" className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                Newsletter
              </Link>
            ) : null}
          </div>
        </div>
        <p className="mt-10 font-data text-[10px] uppercase tracking-data text-muted-foreground">
          © {new Date().getFullYear()} SaaS Radar — Données indicatives, pas des conseils financiers.
        </p>
      </div>
    </footer>
  );
}
