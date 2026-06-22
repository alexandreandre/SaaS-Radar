"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, Radar, Rocket, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useOptionalPortfolio } from "@/contexts/portfolio-context";
import { usePortfolioSummary } from "@/hooks/use-portfolio-summary";
import { useSession } from "@/contexts/session-context";
import {
  MAP_EXPLORE_HREF,
  MAP_EXPLORE_QUERY,
  isMapExploreActive,
} from "@/lib/map-routes";
import { prefetchAllAdminRoutes } from "@/lib/admin/route-prefetch";
import { isCockpitEnabled, isDiscoveryPhase } from "@/lib/product-phase";

const allLinks = [
  { href: MAP_EXPLORE_HREF, label: "Carte du monde", mapExplore: true },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/pricing", label: "Tarifs", discoveryHidden: true },
  { href: "/quiz", label: "Quel SaaS pour moi ?" },
];

function NavbarContent({
  dark = false,
  explore,
}: {
  dark?: boolean;
  explore?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const portfolio = useOptionalPortfolio();
  const summary = usePortfolioSummary(!portfolio);
  const overdueCheckIns = portfolio?.hydrated
    ? portfolio.overdueCheckIns
    : summary.hydrated
      ? summary.overdueCheckIns
      : 0;
  const portfolioHydrated = portfolio?.hydrated ?? summary.hydrated;
  const { isAuthenticated, isAdmin } = useSession();
  const discovery = isDiscoveryPhase();
  const cockpitOn = isCockpitEnabled(isAdmin);

  const links = useMemo(
    () =>
      discovery
        ? allLinks.filter((link) => !link.discoveryHidden)
        : allLinks,
    [discovery],
  );

  useEffect(() => {
    if (isAdmin) {
      router.prefetch("/admin");
      prefetchAllAdminRoutes();
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && cockpitOn) {
      router.prefetch("/mes-saas");
    }
  }, [isAuthenticated, cockpitOn, router]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        dark ? "border-hero-foreground/10 bg-hero/85" : "border-border bg-background/85"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Radar className="h-4 w-4 text-primary logo-pulse" aria-hidden />
          <span
            className={cn(
              "font-data text-xs font-medium uppercase tracking-[0.18em]",
              dark ? "text-hero-foreground" : "text-foreground"
            )}
          >
            SaaS Radar
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => {
            const active = link.mapExplore
              ? isMapExploreActive(pathname, explore)
              : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                  dark
                    ? active
                      ? "text-hero-foreground"
                      : "text-map-muted hover:text-hero-foreground"
                    : active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} />
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Button
                  variant={dark ? "outline" : "ghost"}
                  size="sm"
                  className={cn(
                    dark
                      ? "border-hero-foreground/15 bg-transparent text-hero-foreground hover:bg-hero-foreground/10"
                      : ""
                  )}
                  asChild
                >
                  <Link href="/admin" prefetch>
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              ) : null}
              {cockpitOn ? (
                <Button
                  variant={dark ? "outline" : "ghost"}
                  size="sm"
                  className={cn(
                    "relative hidden sm:inline-flex",
                    dark
                      ? "border-hero-foreground/15 bg-transparent text-hero-foreground hover:bg-hero-foreground/10"
                      : ""
                  )}
                  asChild
                >
                  <Link href="/mes-saas" prefetch>
                    <Rocket className="h-4 w-4" />
                    Mes SaaS
                    {portfolioHydrated && overdueCheckIns > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" />
                    ) : null}
                  </Link>
                </Button>
              ) : null}
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant={dark ? "outline" : "ghost"}
                  size="sm"
                  aria-label="Se déconnecter"
                  className={cn(
                    dark
                      ? "border-hero-foreground/15 bg-transparent text-hero-foreground hover:bg-hero-foreground/10"
                      : ""
                  )}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : discovery ? null : (
            <Button
              variant={dark ? "outline" : "ghost"}
              size="sm"
              className={cn(
                "hidden sm:inline-flex",
                dark
                  ? "border-hero-foreground/15 bg-transparent text-hero-foreground hover:bg-hero-foreground/10"
                  : ""
              )}
              asChild
            >
              <Link href="/login">Connexion</Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href={discovery ? "/opportunities" : MAP_EXPLORE_HREF}>
              {discovery ? "Opportunités" : "Explorer"}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function NavbarWithSearchParams(props: { dark?: boolean }) {
  const explore = useSearchParams().get(MAP_EXPLORE_QUERY);
  return <NavbarContent {...props} explore={explore} />;
}

export function Navbar(props: { dark?: boolean }) {
  return (
    <Suspense fallback={<NavbarContent {...props} />}>
      <NavbarWithSearchParams {...props} />
    </Suspense>
  );
}
