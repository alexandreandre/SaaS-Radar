import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { BrandLogo } from "@/components/brand/brand-logo";
import { resolveNavLinks } from "@/lib/nav-links";

export function Footer() {
  const links = resolveNavLinks();

  return (
    <footer className="border-t border-border bg-background py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:py-14 mobile-page-pad">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <BrandLogo href={null} />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {BRAND_TAGLINE}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground sm:gap-x-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-10 items-center transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm active:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-8 font-data text-[10px] uppercase tracking-data text-muted-foreground sm:mt-10">
          © {new Date().getFullYear()} {BRAND_NAME} — Données indicatives, pas des conseils financiers.
        </p>
      </div>
    </footer>
  );
}
