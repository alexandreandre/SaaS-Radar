import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MAP_EXPLORE_HREF } from "@/lib/map-routes";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <BrandLogo href={null} />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {BRAND_TAGLINE}
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
            <Link href="/mes-saas" className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              Mes SaaS
            </Link>
          </div>
        </div>
        <p className="mt-10 font-data text-[10px] uppercase tracking-data text-muted-foreground">
          © {new Date().getFullYear()} {BRAND_NAME} — Données indicatives, pas des conseils financiers.
        </p>
      </div>
    </footer>
  );
}
